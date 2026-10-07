const Listing = require("../models/listing");
const cloudinary = require("cloudinary").v2;

const createListing = async (req, res) => {
  try {
    req.body.userRef = req.user.id;
    const listing = await Listing.create(req.body);
    return res.status(201).json(listing);
  } catch (error) {
    res.status(400).json("no");
  }
};
const handleUpload = async (req, res, next) => {
  const files = req.files;
  const result = [];
  files.map((file) => {
    result.push(file.filename);
  });
  res.status(200).json(result);
};

const deleteListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return res.status(400).json("Listing not found!");
  }

  if (req.user.id !== listing.userRef.toString()) {
    return res.status(400).json("You can only delete your own listings!");
  }

  try {
    const imageUrls = [];
    await listing.imageUrls.map((url) => {
      imageUrls.push(url.public_id);
    });

    const result = await cloudinary.api.delete_resources(imageUrls);
    await Listing.findByIdAndDelete(req.params.id);
    return res.status(200).json("Listing has been deleted!");
  } catch (error) {
    return res.status(400).json("There is a problem in listing manupulating");
  }
};

const updateListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return res.status(200).json("Listing not found!");
  }

  if (req.user.id !== listing.userRef.toString()) {
    return res.status(200).json("You can only update your own listings!");
  }

  try {
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    return res.status(200).json(updatedListing);
  } catch (error) {
    return res.status(400).json("There is a problem in listing manupulating");
  }
};

const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      res.status(400).json("Listing not found!");
    } else {
      res.status(200).json(listing);
    }
  } catch (error) {
    res.status(400).json("There is a problem in listing manupulating");
  }
};

const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;
    let offer = req.query.offer;

    if (offer === undefined || offer === "false") {
      offer = { $in: [false, true] };
    }

    let furnished = req.query.furnished;

    if (furnished === undefined || furnished === "false") {
      furnished = { $in: [false, true] };
    }

    let parking = req.query.parking;

    if (parking === undefined || parking === "false") {
      parking = { $in: [false, true] };
    }

    let type = req.query.type;

    if (type === undefined || type === "all") {
      type = { $in: ["sale", "rent"] };
    }

    const searchTerm = req.query.searchTerm || "";

    const sort = req.query.sort || "createdAt";

    const order = req.query.order || "desc";

    const listings = await Listing.find({
      name: { $regex: searchTerm, $options: "i" },
      offer,
      furnished,
      parking,
      type,
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    res.status(400).json("There is a problem in listing Search");
  }
};

const getuserListings = async (req, res) => {
  const startIndex = parseInt(req.query.startIndex) | 0;
  if (req.params.id != req.user.id)
    return res.status(204).json({ error: "Unauthorized" });
  try {
    const listings = await Listing.find({ userRef: req.params.id })
      .limit(10)
      .sort({ createdAt: "desc" })
      .skip(startIndex);
    res.status(200).json(listings);
  } catch (error) {
    res.status(400).json("There is a problem in listing Search");
  }
};

const deleteListingImages = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return res.status(200).json("Listing not found!");
  }

  if (req.user.id !== listing.userRef.toString()) {
    return res.status(200).json("You can only delete your own listings!");
  }

  const imageUrls = [];
  await listing.imageUrls.map((url) => {
    imageUrls.push(url.public_id);
  });

  const result = await cloudinary.api.delete_resources(imageUrls);
  res.status(200).json({ data: result });
};

module.exports = {
  getuserListings,
  getListing,
  deleteListing,
  updateListing,
  deleteListingImages,
  createListing,
  handleUpload,
  getListings,
};
