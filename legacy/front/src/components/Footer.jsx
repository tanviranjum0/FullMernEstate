import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <div className="">
      <div className="flex justify-around gap-5 bg-slate-200 py-6">
        <div className="">
          <div className="text-2xl font-semibold py-3">Best Locations</div>
          <div className="list-none text-sm cursor-pointer">
            <li className="hover:underline pb-1 ">USA</li>
            <li className="hover:underline pb-1 ">CANADA</li>
            <li className="hover:underline pb-1 ">FRANCH</li>
            <li className="hover:underline pb-1 ">DUBAI</li>
          </div>
        </div>
        <div className="">
          <div className="text-2xl font-semibold py-3">Legal</div>
          <div className="list-none text-sm cursor-pointer">
            <li className="hover:underline pb-1 ">Terms of Use</li>
            <li className="hover:underline pb-1 ">Privacy Notice</li>
            <Link to={"/about"} className="hover:underline pb-1 ">
              About Us
            </Link>
            <li className="hover:underline pb-1 ">Contact</li>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
