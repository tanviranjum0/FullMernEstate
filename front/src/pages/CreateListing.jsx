import { useState } from "react";
import { useNavigate } from "react-router-dom";
export default function CreateListing() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({

    name: "",
    description: "",
    address: "",
    type: "rent",
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });

  const [imageUploadError, setImageUploadError] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const [contact, setContact] = useState("");
  const handleChange = (e) => {
    if (e.target.id === "sale" || e.target.id === "rent") {
      return setFormData({
        ...formData,
        type: e.target.id,
      });
    }

    if (
      e.target.id === "parking" ||
      e.target.id === "furnished" ||
      e.target.id === "offer"
    ) {
      return setFormData({
        ...formData,
        [e.target.id]: e.target.checked,
      });
    }

    if (
      e.target.type === "number" ||
      e.target.type === "text" ||
      e.target.type === "textarea"
    ) {
      return setFormData({
        ...formData,
        [e.target.id]: e.target.value,
      });
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    const newUrls = []
    setImageUploadError("");
    setLoading(true);
    setError("");

    if (
      formData.name == "" &&
      formData.address == "" &&
      formData.description == ""
    ) {
      setLoading(false);

      setError("All fields are required");
      return;
    }

    const f = document.getElementById("image-input");
    if (Object.keys(f.files).length > 7) {
      setLoading(false);

      setImageUploadError("You can only upload 6 images per listing");
      return;
    }
    if (f.files.length === 0) {
      setLoading(false);

      setImageUploadError("You have to select at least 1 image for uploading");
      return;
    }
    const images = [...f.files];

    images.forEach(async (file, index) => {
      if (file.size > 2000000) {
        setLoading(false);

        setImageUploadError("Maximum 2MB image size is allowed for each image");
        return;
      }
      let form = new FormData();
      form.append("file", file);
      form.append("upload_preset", import.meta.env.VITE_UPLOAD_PRESET);
      form.append("cloud_name", import.meta.env.VITE_CLOUD_NAME);
      const res = await fetch(import.meta.env.VITE_CLOUDINARY_API, {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      newUrls.push(data)

      if (index + 1 === images.length) return createListing()
    });

    async function createListing() {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/listing/create`,
        {
          method: "POST",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...formData, imageUrls: newUrls }),
        }
      );
      const data = await res.json();

      setLoading(false);
      if (data == "error logging in") {
        setLoading(false);

        setError("Please login before creating a listing");
      } else if (data.success === false) {
        setLoading(false);

        setError(data.message);
      } else {
        setLoading(false);

        navigate(`/listing/${data._id}`);
      }
    }
  };


  return (
    <main className="p-3 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">
        Create a Listing
      </h1>
      <form id="main-form" className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 flex-1">
          <label
            className="pl-1 select-none font-mono font-bold"
            htmlFor="listingName"
          >
            Listing Name :{" "}
          </label>
          <input
            name="name"
            type="text"
            className="border p-3  rounded-lg"
            id="name"
            maxLength="62"
            minLength="10"
            required

            onChange={(e) => handleChange(e)}
            value={formData.name}
          />
          <label
            className="pl-1 select-none font-mono font-bold"
            htmlFor="Description"
          >
            Description :{" "}
          </label>
          <textarea
            type="text"
            name="description"
            className="border p-3 rounded-lg"
            id="description"
            required

            onChange={(e) => handleChange(e)}
            value={formData.description}
          />
          <label
            className="pl-1 select-none font-mono font-bold"
            htmlFor="address"
          >
            Address :{" "}
          </label>
          <input
            type="text"
            name="address"
            className="border p-3 rounded-lg"
            id="address"
            required

            onChange={(e) => handleChange(e)}
            value={formData.address}
          />
          <div className="flex my-5 text-xl px-5 md:text-2xl  gap-6 mx-auto flex-wrap">
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="sale"
                name="type"
                defaultValue={"rent"}
                className="w-5"

                onChange={(e) => handleChange(e)}
                checked={formData.type === "sale"}
              />
              <span>Sell</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="rent"
                defaultValue={"rent"}
                name="type"
                className="w-5"

                onChange={(e) => handleChange(e)}
                checked={formData.type === "rent"}
              />
              <span>Rent</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id="parking"
                defaultValue={true}
                name="parking"
                className="w-5"

                onChange={(e) => handleChange(e)}
                checked={formData.parking}
              />
              <span>Parking spot</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                name="furnished"
                defaultValue={false}
                id="furnished"
                className="w-5"

                onChange={(e) => handleChange(e)}
                checked={formData.furnished}
              />
              <span>Furnished</span>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                defaultValue={false}
                id="offer"
                name="offer"
                className="w-5"

                onChange={(e) => handleChange(e)}
                checked={formData.offer}
              />
              <span>Offer</span>
            </div>
          </div>
          <div className="flex mx-auto flex-wrap gap-6">
            <div className="flex  items-center gap-2">
              <input
                type="number"
                id="bedrooms"
                name="bedrooms"
                min="1"
                max="10"
                required
                className="p-3 border border-gray-300 rounded-lg"

                onChange={(e) => handleChange(e)}
                value={formData.bedrooms}
              />
              <p>Beds</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="bathrooms"
                id="bathrooms"
                min="1"
                max="10"
                required
                className="p-3 border border-gray-300 rounded-lg"
                onChange={(e) => handleChange(e)}
                value={formData.bathrooms}
              />
              <p>Baths</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="regularPrice"
                name="regularPrice"
                min="50"
                max="10000000"
                required
                className="p-3 border border-gray-300 rounded-lg"
                onChange={(e) => handleChange(e)}
                value={formData.regularPrice}
              />
              <div className="flex flex-col items-center">
                <p>Regular price</p>
                {formData.type === "rent" && (
                  <span className="text-xs">($ / month)</span>
                )}
              </div>
            </div>
            {formData.offer && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="discountPrice"
                  name="discountPrice"
                  min="0"
                  max="10000000"
                  required
                  className="p-3 border border-gray-300 rounded-lg"

                  onChange={(e) => handleChange(e)}
                  value={formData.discountPrice}
                />
                <div className="flex flex-col items-center">
                  <p>Discounted price</p>

                  {formData.type === "rent" && (
                    <span className="text-xs">($ / month)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col flex-1 gap-4">
          <p className="pl-2 font-semibold">
            Images:
            <span className="font-normal text-gray-600 ml-2">
              The first image will be the cover (max 6)
            </span>
          </p>
          <div className="flex gap-4">
            <form className="flex w-full">
              <input
                id="image-input"
                className="p-3 file:bg-red-200 border bg-violet-100  border-slate-900 rounded-xl w-full"
                type="file"
                accept="image/*"
                multiple
                placeholder="Select Image"
              />

            </form>
          </div>
          <p className="pl-2 text-red-700 text-sm">
            {imageUploadError && imageUploadError}
          </p>

          <button
            disabled={loading}
            onClick={(e) => handleSubmit(e)}
            className="transition-all disabled:bg-slate-600 active:scale-95  hover:scale-[1.01] hover:shadow-xl duration-300 p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
          >
            {loading ? "Uploading..." : "Upload New Listing"}
          </button>
          {error && <p className="text-red-700 text-sm">{error}</p>}
        </div>
      </form>
    </main>
  );
}
