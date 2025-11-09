import { useState } from "react";
import "./SearchPage.css";

import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault(); // prevent page reload
    console.log("Search:", query);
    // TODO: call your API here
  };

  return (
    <section className="h-[100vh]">
        
    </section>
  );
}
