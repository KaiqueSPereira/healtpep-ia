"use client";
import { SearchIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";

const formSchema = z.object({
  search: z.string().min(1, { message: "Digite o que deseja buscar" }).optional(),
});

const search = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      search: "",
    },
  });

  const router = useRouter();
  const handleSearch = (data: z.infer<typeof formSchema>) => {
    router.push("/consulta?search=${data.search}");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSearch)}
        className="flex items-center gap-2"
      >
        <FormField
          control={form.control}
          name="search"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Input
                  placeholder="Faça sua pesquisa"
                  {...field}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          size="icon"
          variant="primary"
          onClick={handleSearch}
          type="submit"
        >
          <SearchIcon />
        </Button>
      </form>
    </Form>
  );
};
<></>;

export default search;
