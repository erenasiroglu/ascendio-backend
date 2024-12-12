const supabase = require("../config/supabaseClient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([
        {
          id: authData.user.id,
          email: email,
          user_detail: {
            username: username,
          },
        },
      ]);

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    res.status(201).json({
      user: authData.user,
      message: "User created successfully",
    });
  } catch (error) {
    res.status(500).json({ error: "Signup failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for email:", email);

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      console.log("Auth Error:", authError);
      return res.status(401).json({ error: authError.message });
    }

    console.log("Auth Success:", authData);

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (userError) {
      console.log("User Data Error:", userError);
      return res.status(400).json({ error: userError.message });
    }

    const token = jwt.sign(
      {
        userId: authData.user.id,
        email: authData.user.email,
        userDetails: userData.user_detail,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      user: {
        ...authData.user,
        userDetails: userData.user_detail,
      },
      token,
    });
  } catch (error) {
    console.log("Login Error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};
