import { Link, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { StoreContext } from "../context/StoreContext";

const Login = () => {

  const { setIsAlreadyLoggedIn } = useContext(StoreContext)

  const [error, setError] = useState("");
  const navigate = useNavigate();
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const email = document.getElementById("loginEmail").value
    const password = document.getElementById("loginPassword").value
    if (!email | !password) {
      return setError("All input fields are require...")
    }
    if (!validateEmail(email)) {
      return setError("Please provide a valid email address")
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        {
          method: "POST",
          credentials: "include",
          mode: "cors",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            password,
            email
          }),
        }
      );

      const data = await res.json();
      if (data.status == "Login successfully!") {
        setIsAlreadyLoggedIn(true)
        localStorage.setItem("user", JSON.stringify(data));
        navigate("/");
      } else if (
        data.status == "No user found .." ||
        data.status == "Wrong Credentials" ||
        data.status == "Login Problem"
      ) {
        setError(data.status);
      } else {
        setError(data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="p-3 h-screen max-w-lg mx-auto pb-40">
      <h1 className="text-3xl text-center font-semibold my-7">Sign In</h1>
      <form onSubmit={(e) => handleSubmit(e)} className="flex flex-col gap-2">
        <label className="pl-3 font-mono font-bold" htmlFor="Email">
          Email Address :{" "}
        </label>
        <input
          type="email"
          className="border py-2 px-3 rounded-lg"
          id="loginEmail"
        />
        <label className="pl-3 font-mono font-bold" htmlFor="Password">
          Password :{" "}
        </label>
        <input
          type="password"
          className="border px-3 py-2 rounded-lg"
          id="loginPassword"
        />

        <button
          type="submit"
          onClick={(e) => handleSubmit(e)}
          className="bg-slate-700 mt-5 active:scale-95 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
        >
          Sign In
        </button>
      </form>

      {error && <p className="text-red-700 mt-5">{error}</p>}
      <div className="flex gap-2 mt-5">
        <p>Don&apos;t have an account?</p>
        <Link to={"/sign-up"}>
          <span className="text-blue-700">Sign up</span>
        </Link>
      </div>
    </div>
  );
};

export default Login;
