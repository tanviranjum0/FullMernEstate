import { FaSearch } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { StoreContext } from "../context/StoreContext";
const Navbar = () => {
  const user = JSON.parse(localStorage?.getItem("user"))
  const { isAlreadyLoggedIn } = useContext(StoreContext)
  const [searchTerm, setSearchTerm] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const handleNavOpen = () => {
    setNavOpen(!navOpen);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (navOpen) {
      setNavOpen(false);
    }
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("searchTerm", searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get("searchTerm");
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    }
  }, []);

  return (
    <div className="select-none">
      {navOpen ? (
        <div className=" fixed z-50 opacity-1 bg-[#a1b7db] mx-auto h-screen w-full  flex justify-start items-start ">
          <div className=" pl-10 pt-10 flex text-2xl flex-col justify-between">
            <form
              onSubmit={handleSubmit}
              className="bg-slate-100 p-3  flex rounded-lg  items-center mb-10"
            >
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-lg md:text-xl focus:outline-none w-50 sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button>
                <FaSearch className="transition-all text-lg md:text-2xl duration-200 text-slate-600 hover:scale-110 " />
              </button>
            </form>
            <Link
              to={"/"}
              onClick={handleNavOpen}
              className="mx-5 py-3 md:py-0 hover:underline"
            >
              Home
            </Link>
            <Link
              onClick={handleNavOpen}
              to={"/about"}
              className="py-3 md:py-0  mx-5 hover:underline"
            >
              About
            </Link>
            <Link
              onClick={handleNavOpen}
              to={"/login"}
              className="mx-5 py-3 md:py-0  hover:underline"
            >
              Login
            </Link>
            <Link
              onClick={handleNavOpen}
              to={"/create-listing"}
              className="mx-5 py-3 md:py-0  hover:underline"
            >
              Create Listing
            </Link>
          </div>
          <div
            onClick={handleNavOpen}
            className="text-4xl cursor-pointer select-none absolute right-10 top-10"
          >
            X
          </div>
        </div>
      ) : (
        <div className="bg-[#a1b7db] text-xl flex items-center justify-center h-20 shadow-2xl">
          <div className="mx-auto w-10/12  flex justify-around items-center">
            <Link to="/" className="flex text-xl md:text-3xl">
              <b>
                <i className="text-stone-700">TanvirDev</i>
              </b>
              <p className="font-semibold">Property</p>
            </Link>
            <div className="hidden md:flex items-center justify-between">
              <Link to={"/"} className="mx-5 hover:underline">
                Home
              </Link>
              <Link to={"/about"} className="mx-5 hover:underline">
                About
              </Link>

              {!isAlreadyLoggedIn && <Link to={"/login"} className="mx-5 hover:underline">
                Create Listing
              </Link>}
              {isAlreadyLoggedIn && <Link to={"/create-listing"} className="mx-5 hover:underline">
                Create Listing
              </Link>}
              {!isAlreadyLoggedIn && <Link to={"/login"} className="mx-5 hover:underline">
                Login
              </Link>}
              {isAlreadyLoggedIn &&
                <Link to={`/profile/${user?.userObject.id}`} className="cursor-pointer"><img src={`${user?.avatar.secure_url}`} alt="" className="h-5 w-5 object-cover rounded-full" /></Link>
              }

            </div>
            <div className="sm:flex justify-center hidden items-center">
              <form
                onSubmit={handleSubmit}
                className="bg-slate-100 p-3 rounded-lg flex items-center"
              >
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent text-lg md:text-xl focus:outline-none w-24 sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button>
                  <FaSearch className="transition-all active:scale-95 text-lg md:text-2xl duration-200 text-slate-600 hover:scale-110 " />
                </button>
              </form>
            </div>
            <div
              onClick={handleNavOpen}
              className="select-none text-4xl md:hidden cursor-pointer"
            >
              =
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
