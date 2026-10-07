import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Listing from "./pages/Listing";
import Search from "./pages/Search";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import CreateListing from "./pages/CreateListing";
import Test from "./pages/Test";
import "./App.css"
import ContextContainer from "./context/StoreContext";
import Profile from "./pages/Profile";
import EditListing from "./pages/EditListing";
const App = () => {

  return (
    <>
      <ContextContainer>
        <div className="bg-[#a2b8dbb6]  transition-all duration-300 scroll-smooth">
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create-listing" element={<CreateListing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/test" element={<Test />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route path="/about" element={<About />} />
              <Route path="/search" element={<Search />} />
              <Route path="/listing/:id" element={<Listing />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/edit-listing/:id" element={<EditListing />} />
            </Routes>
            <Footer />
          </BrowserRouter>
        </div>
      </ContextContainer>
    </>
  );
};

export default App;
