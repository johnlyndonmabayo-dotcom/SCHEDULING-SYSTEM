
const SUPABASE_URL =
    "https://aihmpwqnhsuiwmcmcoft.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_IVUuX3igxnwDGyQGnk7Z4Q_XX0iIW8M";

// Initialize Supabase with persistent login sessions.
if (!window.supabase) {
    throw new Error(
        "Supabase library did not load. Check your internet connection."
    );
}

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

// REGISTER USER
async function signUpUser(email, password, fullName) {
    if (!email || !password || !fullName) {
        throw new Error("Please complete all registration fields.");
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
            data: {
                full_name: fullName.trim()
            }
        }
    });

    if (error) {
        throw error;
    }

    return data;
}

// LOGIN USER
async function signInUser(email, password) {
    if (!email || !password) {
        throw new Error("Enter your email and password.");
    }

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });

    if (error) {
        throw error;
    }

    if (!data.session) {
        throw new Error(
            "Login did not create a session. Please try again."
        );
    }

    return data;
}

// LOGOUT USER
async function signOutUser() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        throw error;
    }
}

// GET CURRENT USER PROFILE
async function getMyProfile() {
    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError) {
        throw userError;
    }

    const user = userData.user;

    if (!user) {
        throw new Error("Please log in first.");
    }

    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("id, full_name, role")
            .eq("id", user.id)
            .maybeSingle();

    if (profileError) {
        throw profileError;
    }

    if (!profile) {
        throw new Error(
            "Your profile was not found. Check the profiles table in Supabase."
        );
    }

    return profile;
}
