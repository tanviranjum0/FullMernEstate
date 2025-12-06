/* eslint-disable react/prop-types */
import { createContext, useEffect, useState } from "react";

export const StoreContext = createContext(null);

const ContextContainer = ({ children }) => {
  const [userListings, setUserListings] = useState([])
  const [initialListings, setInitialListings] = useState([])
  const [isAlreadyLoggedIn, setIsAlreadyLoggedIn] = useState(false)

  const checkAlreadyLoggenIn = async () => {
    if (!localStorage.getItem("user")) {
      setIsAlreadyLoggedIn(false)
      return
    }
    const data = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/check-login`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
    })
    if (data.status == 200) {
      setIsAlreadyLoggedIn(true)
    } else {
      setIsAlreadyLoggedIn(false)
    }

  }
  const fetchInitialListings = async () => {
    const sale = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/listing/get?limit=9&type=sale`
    );
    const rent = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/listing/get?limit=9&type=rent`
    );
    const data = await sale.json();
    const data2 = await rent.json();
    setInitialListings([...data, ...data2]);
  }
  useEffect(() => {
    fetchInitialListings()
    checkAlreadyLoggenIn()
  }, [])

  const ContextValue = { isAlreadyLoggedIn, setInitialListings, initialListings, userListings, setUserListings, setIsAlreadyLoggedIn };

  return (
    <StoreContext.Provider value={ContextValue}>
      {children}
    </StoreContext.Provider>
  );
};

export default ContextContainer;
