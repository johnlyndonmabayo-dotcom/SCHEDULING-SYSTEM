
document.addEventListener("DOMContentLoaded", () => {
    initEmployees();
});

function initEmployees() {
    const form = document.getElementById("employeeForm");
    const list = document.getElementById("employeeList");
    const message = document.getElementById("employeeMessage");
    const saveButton = document.getElementById("saveEmployee");

    if (!form || !list || !message || !saveButton) {
        console.error("Employee form or table elements are missing.");
        return;
    }

    if (!window.supabase || typeof supabaseClient === "undefined") {
        message.textContent = "Supabase failed to load. Check your script paths and internet connection.";
        message.style.color = "#dc2626";
        return;
    }

    // This page is for administrators only.
    (async () => {
        try {
            const { data, error } = await supabaseClient.auth.getSession();
            if (error) throw error;
            if (!data.session) {
                window.location.replace("page/login.html");
                return;
            }
            const profile = await getMyProfile();
            if (!profile || profile.role !== "admin") {
                document.body.innerHTML = "<main style='font-family:Arial,sans-serif;max-width:600px;margin:60px auto;padding:24px'><h1>Access denied</h1><p>Only administrators can manage employees.</p><a href='index.html'>Return to ShiftFlow</a></main>";
                return;
            }
            loadEmployees();
        } catch (error) {
            console.error("Employee page access check failed:", error);
            showMessage("Could not verify administrator access: " + (error.message || "Unknown error"), true);
        }
    })();

    function showMessage(text, isError = false) {
        message.textContent = text;
        message.style.color = isError ? "#dc2626" : "#166534";
    }

    async function loadEmployees() {
        list.replaceChildren();

        try {
            const { data, error } = await supabaseClient
                .from("employees")
                .select("employee_id, full_name, position, department, status")
                .order("employee_id", { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                const row = document.createElement("tr");
                const cell = document.createElement("td");

                cell.colSpan = 5;
                cell.textContent = "No employees registered yet.";
                cell.style.padding = "16px";

                row.appendChild(cell);
                list.appendChild(row);
                return;
            }

            data.forEach(employee => {
                const row = document.createElement("tr");

                [
                    employee.full_name,
                    employee.position,
                    employee.department,
                    employee.status || "Active"
                ].forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = value ?? "—";
                    cell.style.padding = "12px";
                    row.appendChild(cell);
                });

                const actionCell = document.createElement("td");
                actionCell.style.padding = "12px";
                const statusButton = document.createElement("button");
                const isActive = String(employee.status || "Active").toLowerCase() === "active";
                statusButton.type = "button";
                statusButton.textContent = isActive ? "Deactivate" : "Activate";
                statusButton.dataset.employeeId = employee.employee_id;
                statusButton.dataset.nextStatus = isActive ? "Inactive" : "Active";
                statusButton.className = "employee-status-toggle";
                statusButton.style.cssText = "padding:7px 10px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;color:#2949a8;cursor:pointer";
                actionCell.appendChild(statusButton);
                row.appendChild(actionCell);
                list.appendChild(row);
            });

        } catch (error) {
            console.error("Employee loading error:", error);
            showMessage("Could not load employees: " + error.message, true);

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 5;
            cell.textContent = "Failed to load employee records.";
            cell.style.padding = "16px";

            row.appendChild(cell);
            list.appendChild(row);
        }
    }

    list.addEventListener("click", async event => {
        const button = event.target.closest("button.employee-status-toggle");
        if (!button) return;

        const employeeId = Number(button.dataset.employeeId);
        const nextStatus = button.dataset.nextStatus;
        if (!Number.isInteger(employeeId) || employeeId <= 0) return;

        button.disabled = true;
        try {
            const { error } = await supabaseClient
                .from("employees")
                .update({ status: nextStatus })
                .eq("employee_id", employeeId);
            if (error) throw error;
            showMessage(`Employee status changed to ${nextStatus}.`);
            await loadEmployees();
        } catch (error) {
            console.error("Employee status update failed:", error);
            showMessage("Could not update employee: " + error.message, true);
            button.disabled = false;
        }
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const fullName =
            document.getElementById("fullName").value.trim();

        const position =
            document.getElementById("position").value.trim();

        const department =
            document.getElementById("department").value.trim();

        if (!fullName || !position || !department) {
            showMessage("Please complete all fields.", true);
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
            const { data, error } = await supabaseClient
                .from("employees")
                .insert({
                    full_name: fullName,
                    position: position,
                    department: department,
                    status: "Active"
                })
                .select("employee_id, full_name")
                .single();

            if (error) throw error;

            form.reset();

            showMessage(
                "Employee added successfully! ID: " + data.employee_id
            );

            await loadEmployees();

        } catch (error) {
            console.error("Employee saving error:", error);
            showMessage("Could not save employee: " + error.message, true);

        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Add Employee";
        }
    });

    // loadEmployees() is called only after the admin access check succeeds.
}
