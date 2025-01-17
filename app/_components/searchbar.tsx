"use client";
import { SearchIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";

const search = () => {
  const[search, setSearch] = useState("");
  const router = useRouter();
  const handleSearch = (i) => {
    i.preventDefault();
    router.push('/consulta?search=${search}');
  }
    
    return (
      <form onSubmit={handleSearch} className="flex items-center gap-5 p-5">
        <Input
          placeholder="Pesquisar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button size="icon" variant="primary" onClick={handleSearch} type="submit">
          <SearchIcon />
        </Button>
      </form>
    );
}
 
export default search;