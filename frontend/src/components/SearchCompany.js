import "./SearchCompany.css";
import { Button } from "@mui/material";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchCompanies() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    
    const updateQuery = (new_query) => {
        setSearchQuery(new_query)
    }

    const submitSearch = () => {
        const q = searchQuery.trim();
        if (!q) return;
        navigate(`/search?q=${encodeURIComponent(q)}`);
    }
    
    return (
        <div id="search-company-warpper" className="bg-white h-[500px] w-[700px]">

                <h1 className="text-[40px] font-semibold">Search for companies...</h1>

                <TextField
                    onChange={(e) => updateQuery(e.target.value)}
                    onKeyDown={(e) => {
                    if (e.key === "Enter") submitSearch();
                    }} 
                    variant="outlined"
                    fullWidth
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />

                <Button 
                    onClick={submitSearch} 
                    className="search-btn" 
                    variant="contained" 
                    color="primary">
                        Search
                </Button>
            </div>
    )
}