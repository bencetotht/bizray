import "./SearchCompany.css";
import { Button } from "@mui/material";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";

export default function SearchCompanies() {
    return (
        <div id="search-company-warpper" className="bg-white h-[500px] w-[700px]">

                <h1 className="text-[40px] font-semibold">Search for companies...</h1>

                <TextField
                    label="Search"
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

                
                <Button className="self-end" variant="contained" color="primary">
                    Search Now
                </Button>
                



            </div>
    )
}