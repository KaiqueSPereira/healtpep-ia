"use client";

import { useParams } from "next/navigation";
import Updateconsulta from "./_components/updateconsulta";

const Page = () => {
  const params = useParams(); // Captura o ID da URL

  if (!params.id) {
    return <h1>ID da consulta não encontrado</h1>;
  }

  return (
    <div>
      <Updateconsulta params={{ id: Array.isArray(params.id) ? params.id[0] : params.id }} />
    </div>
  );
};

export default Page;
