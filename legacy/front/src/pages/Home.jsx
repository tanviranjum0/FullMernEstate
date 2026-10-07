import { TypeAnimation } from "react-type-animation";
import HeroSection from "../components/HeroSection";
import "../assets/css/home.css";

const Home = () => {
  return (
    <div className="w-full h-full bg-[#a1b7db9e] relative">
      <div className="flex mx-auto md:w-4/6 flex-col md:px-20 justify-center md:right-[0px] absolute px-10">
        <TypeAnimation
          className="pb-3 text-slate-900 pt-14"
          style={{ fontSize: "3rem" }}
          sequence={["Nobody does it better!", 1000]}
          wrapper="span"
          speed={10}
        />
        <div className="text-3xl">
          Believe in yourself and all that you are, and know that there is
          something Real estate waiting for you
        </div>
        <div className="font-light pt-3 ">
          Becoming a real estate attorney is a tough job. You will always have
          to deal with battles of wills!
        </div>
      </div>
      <div className="home"></div>
      <div className="mx-auto">
        <HeroSection />
      </div>
    </div>
  );
};

export default Home;
