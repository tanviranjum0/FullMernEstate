import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
export default function SignUp() {

  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const navigate = useNavigate();

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {

    e.preventDefault();
    setLoading(true)
    setError("")
    const username = document.getElementById("username").value
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const image = document.getElementById("file_input").files[0]
    if (!username | !email | !password | !image) {
      setLoading(false)
      return setError("All input fields are required...")
    }
    if (!validateEmail(email)) {
      setLoading(false)
      return setError("Please provide a valid email address")
    }

    const isExistingUser = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/${email}`)
    const existed = await isExistingUser.json()
    if (!existed.data) {
      setLoading(false)
      return setError("This email is already exists...")
    }

    let form = new FormData();
    form.append("file", image);
    form.append("upload_preset", import.meta.env.VITE_UPLOAD_PRESET);
    form.append("cloud_name", import.meta.env.VITE_CLOUD_NAME)
    let imageRes = await fetch(import.meta.env.VITE_CLOUDINARY_API, {
      method: "POST",
      body: form,
    });

    const ImageData = await imageRes.json();

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`,
      {
        method: "POST",
        credentials: "include",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          avatar: ImageData
        }),
      }
    );
    const data = await res.json();
    if (data == "This email is already exist...") {
      setLoading(false)
      return setError(data);
    }
    setLoading(false)
    if (res.status == 400) return setError(data);
    navigate("/login");
  };

  return (
    <div className="p-3 max-w-lg mx-auto pb-40">
      <h1 className="text-3xl text-center font-semibold my-7">Sign Up</h1>
      <form onSubmit={(e) => handleSubmit(e)} className="flex flex-col gap-2">
        <label className="pl-3 font-mono font-bold" htmlFor="username">
          Username :{" "}
        </label>
        <input
          type="text"
          className="border p-3 rounded-lg"
          id="username"
        />
        <label className="pl-3 font-mono font-bold" htmlFor="Email">
          Email :{" "}
        </label>
        <input
          type="email"
          className="border p-3 rounded-lg"
          id="email"
        />
        <label className="pl-3 font-mono font-bold" htmlFor="password">
          Password :{" "}
        </label>
        <input
          type="password"
          className="border p-3 rounded-lg"
          id="password"
        />
        <label className="pl-3 font-mono font-bold" htmlFor="file_input">Upload a profile image</label>
        <input className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer
         bg-gray-50 " aria-describedby="file_input_help" id="file_input" type="file" />
        <button
          onClick={(e) => handleSubmit(e)}
          type="submit"
          disabled={loading}
          className="mt-5 bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
        >
          {loading && "Please Wait..."}
          {!loading && "Sign Up"}
        </button>
      </form>
      {error && <div className="text-red-700">{error}</div>}
      <div className="pl-2 flex gap-2 mt-5">
        <p>Already have an account?</p>
        <Link to={"/login"}>
          <span className="text-blue-700">Login</span>
        </Link>
      </div>
    </div>
  );
}
