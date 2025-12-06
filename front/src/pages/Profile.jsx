/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect, useState } from "react";
import { RiListSettingsLine } from "react-icons/ri";
import { RiDeleteBin5Line } from "react-icons/ri";
import { StoreContext } from "../context/StoreContext";
import { Link, useNavigate } from "react-router-dom";

const Profile = () => {
    const navigate = useNavigate()
    const [more, setMore] = useState(true)
    const [error, setError] = useState("")
    const [logOutLoading, setLogOutLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [listingDeleteLoading, setListingDeleteLoading] = useState(false)
    const user = JSON.parse(localStorage.getItem("user"))

    const { userListings, setUserListings, setInitialListings } = useContext(StoreContext)
    useEffect(() => {
        if (!user) return window.location.href = "/"
        async function getListings() {
            const listings = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/listing/user-listings/${user.userObject.id}`, {
                method: "GET",
                mode: "cors",
                credentials: "include",
            })
            const data = await listings.json()
            if (data.length < 10) {
                setMore(false);
            }
            setInitialListings(data)
            setUserListings({ data, progress: data.length })
        }
        getListings()
    }, [])

    const onMoreClick = async () => {
        const urlParams = new URLSearchParams(location.search);
        urlParams.set("startIndex", userListings.progress);
        const searchQuery = urlParams.toString();
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/listing/user-listings/${user.userObject.id}?${searchQuery}`, {
            method: "GET",
            mode: "cors",
            credentials: "include",
        })
        const data = await res.json();
        if (data.length < 10) {
            setMore(false);
        }
        setInitialListings(data)
        setUserListings({ data, progress: userListings.progress + data.length });
        document.getElementById("userListingContainer").scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'start'
        })

    };
    const handleSignOut = async () => {
        setLogOutLoading(true)
        document
            .getElementById("confirmLogOutBox")
            .classList.toggle("hidden");
        const logOut = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signout`, {
            mode: "cors",
            credentials: "include"
        })
        if (logOut.status == 200) {
            localStorage.clear()
            window.location.href = "/"
        }
        setLogOutLoading(false)
    }

    const handleAccountDelete = async () => {
        setDeleteLoading(true)
        document
            .getElementById("confirmDeleteAccountBox")
            .classList.toggle("hidden");
        const data = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/delete/${user.userObject.id}`, {
            method: "DELETE",
            mode: "cors",
            credentials: "include"
        })
        if (data.status == 200) {
            localStorage.clear()
            window.location.href = "/"
        }
        setDeleteLoading(false)

    }

    const handleDeleteListing = async (e) => {
        e.preventDefault()
        setListingDeleteLoading(true)
        const listingId = JSON.parse(localStorage.getItem("ListingToBeDeleted"));

        const data = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/listing/delete/${listingId}`, {
            method: "DELETE",
            mode: "cors",
            credentials: "include"
        })
        const res = await data.json()
        document
            .getElementById("confirmListingDeleteBox")
            .classList.toggle("hidden");
        if (data.status == 200) {
            setError(res)
            setTimeout(() => setError(""), 3000)
            const updatedListings = userListings.data.filter((listing) => listing._id !== listingId);
            setUserListings({ data: updatedListings, progress: updatedListings.length });
        }
        setListingDeleteLoading(false)
    }
    return (
        <div className='w-[70vw] mx-auto'>
            <div id="confirmLogOutBox" className="fixed overflow-hidden h-full hidden z-10 inset-0 backdrop-blur">
                <div className="h-[100vh] w-[100vw] flex justify-center items-center">
                    <div className="w-[90vw] p-5 bg-sky-50 md:w-[40vw] shadow-2xl">
                        <div className="font-semibold text-xl ">Are you sure, you want to log out?</div>
                        <div className="flex justify-end gap-5 ">
                            <div onClick={() => {
                                setLogOutLoading(false);
                                document
                                    .getElementById("confirmLogOutBox")
                                    .classList.toggle("hidden");
                            }} className="px-3 py-1.5 font-semibold text-2xl hover:bg-green-600 cursor-pointer  bg-green-500  border rounded">No</div>
                            <div disabled={logOutLoading} onClick={() => handleSignOut()} className="px-3 py-1.5 font-semibold text-2xl hover:bg-red-600 cursor-pointer bg-red-500  border rounded">{logOutLoading ? "Logging Out..." : "Yes"}</div></div>
                    </div>
                </div>
            </div>
            <div id="confirmDeleteAccountBox" className="fixed overflow-hidden h-full hidden z-10 inset-0 backdrop-blur">
                <div className="h-[100vh] w-[100vw] flex justify-center items-center">
                    <div className="w-[90vw] p-5 bg-sky-50 md:w-[40vw] shadow-2xl">
                        <div className="font-semibold text-xl py-2">Are you sure, you want to delete Your account?</div>
                        <div className="flex justify-end gap-5 ">
                            <div onClick={() => {
                                document
                                    .getElementById("confirmDeleteAccountBox")
                                    .classList.toggle("hidden");
                            }} className="px-3 py-1.5 font-semibold text-2xl hover:bg-green-600 cursor-pointer  bg-green-500 border rounded">No</div>
                            <div disabled={deleteLoading} onClick={() => handleAccountDelete()} className="px-3 py-1.5 font-semibold text-2xl hover:bg-red-600 cursor-pointer bg-red-500  border rounded">{deleteLoading ? "Deleting..." : "Yes"}</div></div>
                    </div>
                </div>
            </div>
            <div id="confirmListingDeleteBox" className="fixed overflow-hidden h-full hidden z-10 inset-0 backdrop-blur">
                <div className="h-[100vh] w-[100vw] flex justify-center items-center">
                    <div className="w-[90vw] p-5 bg-sky-50 md:w-[40vw] shadow-2xl">
                        <div className="font-semibold text-xl py-2">Are you sure, you want to delete Your This Listing?</div>
                        <div className="flex justify-end gap-5 ">
                            <div onClick={() => {
                                document
                                    .getElementById("confirmListingDeleteBox")
                                    .classList.toggle("hidden");
                            }} className="px-3 py-1.5 font-semibold text-2xl hover:bg-green-600 cursor-pointer  bg-green-500 border rounded">No</div>
                            <div disabled={listingDeleteLoading} onClick={(e) => handleDeleteListing(e)} className="px-3 py-1.5 font-semibold text-2xl hover:bg-red-600 cursor-pointer bg-red-500 border rounded">{listingDeleteLoading ? "Deleting..." : "Yes"}</div></div>
                    </div>
                </div>
            </div>
            <div className="flex justify-between my-10">
                <div className="flex items-center justify-center object-cover flex-col select-none"><img src={`${user.avatar.secure_url}`} alt="" className="h-40 object-cover w-40 rounded-lg" />
                </div>
                <div className="p-5 flex flex-col items-center justify-center">
                    <div className='uppercase text-2xl'>{user.userObject.name}</div>
                    <div>{user.userObject.email}</div>
                    {error && <div className="text-red-700">{error}</div>}
                </div>
                <div className="p-5 flex flex-col items-center justify-center">
                    <div onClick={() => {
                        document
                            .getElementById("confirmDeleteAccountBox")
                            .classList.toggle("hidden");
                    }} className="bg-red-700 text-center hover:bg-red-600 px-3 py-2 rounded border font-semibold text-white cursor-pointer">Delete Account</div>
                    <div onClick={() => {
                        document
                            .getElementById("confirmLogOutBox")
                            .classList.toggle("hidden");
                    }} className="bg-sky-700 text-center hover:bg-sky-600 px-3 py-2 rounded border font-semibold text-white cursor-pointer">Log Out</div>
                </div>
            </div>
            <div className="text-center text-4xl w-full underline mb-5">Your Listings</div>
            <div id="userListingContainer" className="min-h-[60vh]">
                {userListings && userListings.data && userListings.data.map((listing) => {
                    return (
                        <div key={listing._id} className="p-3 gap-3 cursor-pointer items-center bg-gray-300 border flex justify-between">
                            <img src={listing.imageUrls[0].secure_url} alt="" className="h-10 object-cover w-16" />
                            <Link to={`/listing/${listing._id}`} className="leading-tight hover:text-blue-800">
                                <div className="text-center">{listing.name}</div>
                                <div className="text-center">{listing.description}</div>
                                <div className="text-center text-sm">{new Date(listing.updatedAt).toUTCString()}</div>
                            </Link>
                            <div className="flex justify-center items-center gap-5">
                                <div onClick={() => {
                                    localStorage.setItem("ListingToBeEdited", JSON.stringify(listing))
                                    navigate(`/edit-listing/${listing._id}`)

                                }}><RiListSettingsLine className="h-10 w-10 p-1 hover:border-2 border-black" /></div>
                                <div onClick={() => {
                                    localStorage.setItem("ListingToBeDeleted", JSON.stringify(listing._id))
                                    document
                                        .getElementById("confirmListingDeleteBox")
                                        .classList.toggle("hidden");
                                }}><RiDeleteBin5Line className="h-10 w-10 p-1 hover:border-2 border-black" /></div>
                            </div>
                        </div>
                    )
                })}
                <div className="w-full flex justify-center my-2">
                    {more && (
                        <button
                            onClick={() => onMoreClick()}
                            className="transition-all disabled:bg-slate-600 active:scale-95  hover:scale-[1.01] hover:shadow-xl duration-300 p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
                        >
                            Show more
                        </button>
                    )}</div>
            </div>
        </div>
    )
}

export default Profile