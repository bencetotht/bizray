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
    const [error, setError] = useState("");
    
    const updateQuery = (new_query) => {
        setSearchQuery(new_query);
        if (error) setError(""); // Clear error when user types
    }

    const submitSearch = () => {
        const q = searchQuery.trim();
        if (!q) {
            setError("Please enter a search term");
            return;
        }
        if (q.length < 3) {
            setError("Minimum search length is 3 characters");
            return;
        }
        setError("");
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
                    error={!!error}
                    helperText={error}
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