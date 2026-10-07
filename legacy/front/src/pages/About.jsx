import "../assets/css/about.css";
const About = () => {
  return (
    <div className=" text-black">
      <div className="main font-semibold flex  items-center flex-col py-8 ">
        <div className="text-4xl pb-2 p-5 md:pb-5 md:p-10 text-stone-700">
          Home to all your property needs
        </div>
        <div className="text-2xl p-5">
          BUY | SELL | RENT | LEGAL | MORTGAGE | INTERIOR
        </div>
        <div className="hero text-center w-3/4">
          <div className="info mx-2 md:mx-20">
            <div className="md:text-3xl text-xl pt-2 md:pt-10">At a glance</div>
            <div className="font-mono py-5">
              Starting back in 2016, RoksanaProperty has now become the only
              real estate solutions provider in the World and its largest
              transacting real estate company. Combining an unmatched online and
              offline presence with our incomparable database of information,
              Bproperty has become the pioneer that caters to the needs of those
              with real estate queries, whether property search or
              customization, providing supporting services such as legal,
              mortgage, and interior to ensure all solutions are under one roof.
            </div>
            <div className="text-sm">
              Bproperty utilizes technology to drive solutions for all
              stakeholders within the real estate industry with the vision to
              ensure that all peoples have access to a trusted and secure real
              estate service provider.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
