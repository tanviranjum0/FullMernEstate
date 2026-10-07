const User = require("../models/user");
const Listing = require("../models/listing");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;

const updateUser = async (req, res) => {
  if (req.user.id !== req.params.id)
    res.send("You can only update your own account!");
  try {
    if (req.body.password) {
      req.body.password = bcrypt.hash(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
          avatar: req.body.avatar,
        },
      },
      { new: true }
    );

    res.status(200).json("Successful", updatedUser);
  } catch (error) {
    res.send("There is a problem Updating");
  }
};

const deleteUser = async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(204).json({ data: "There is a problem deleting user" });
  }

  try {
    const userListings = await Listing.find({ userRef: req.params.id });
    const user = await User.findById(req.params.id);
    const imageUrls = [];
    userListings.forEach((listing) => {
      listing.imageUrls.map(async (url) => {
        imageUrls.push(url.public_id);
      });
    });
    imageUrls.push(user.avatar.public_id);
    const result = await cloudinary.api.delete_resources(imageUrls);
    const deleteCount = await Listing.deleteMany({ userRef: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.clearCookie("access_token").status(200).json("User has been deleted!");
  } catch (error) {
    res.send("There is a problem Deleting");
  }
};

const getUserListings = async (req, res) => {
  if (await !req.user.id) return res.send("You had not listed any AD");
  try {
    const listings = await Listing.find({ userRef: req.user.id });
    listings.length !== 0
      ? res.status(200).json(listings)
      : res.send("you have no listing");
  } catch (error) {
    res.send("There is a problem Getting Listings");
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(200).json({ data: "No User Found" });
    const { password: pass, ...rest } = user._doc;
    res.status(200).json(rest);
  } catch (error) {
    res.send("There is a problem Getting User");
  }
};

module.exports = { deleteUser, getUser, getUserListings, updateUser };
