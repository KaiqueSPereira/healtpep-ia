"use client";
import { SearchIcon, XCircle } from "lucide-react"; 
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { useEffect } from "react"; 


const formSchema = z.object({
  search: z.string().optional(), 
});


interface SearchbarProps {
  onSearch: (term: string) => void;
  searchTerm: string;
  onClear: () => void;
}


// Add props to the component signature
const Searchbar: React.FC<SearchbarProps> = ({ onSearch, searchTerm, onClear }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      search: searchTerm, // Use the prop for initial value
    },
  });

  // Update form value when searchTerm prop changes
  useEffect(() => {
    form.setValue("search", searchTerm);
  }, [searchTerm, form]);


  // Modified handleSearch to call the onSearch prop
  const handleSearch = (data: z.infer<typeof formSchema>) => {
    // Ensure we pass an empty string if data.search is undefined
    onSearch(data.search || "");
  };

  // Handle clearing the search from within the component
  const handleClearClick = () => {
      form.setValue("search", ""); // Clear form input
      onClear(); // Call the onClear prop
  };


  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSearch)}
        className="flex items-center gap-2 w-full" // Added w-full for better layout
      >
        <FormField
          control={form.control}
          name="search"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <div className="relative"> {/* Added a div for relative positioning of the clear button */}
                    <Input
                    placeholder="Faça sua pesquisa"
                    {...field}
                    className="pr-8 w-full" // Add padding-right to make space for the clear button
                    />
                     {/* Clear button - visible only if there's a search term */}
                    {searchTerm && (
                         <Button
                            type="button" // Use type="button" to prevent form submission
                            variant="ghost"
                            size="sm"
                            onClick={handleClearClick}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0" // Position the button
                         >
                           <XCircle className="h-4 w-4 text-gray-500" />
                         </Button>
                    )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          size="icon"
          variant="default"
          type="submit"
        >
          <SearchIcon />
        </Button>
      </form>
    </Form>
  );
};


export default Searchbar;