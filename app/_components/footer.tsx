import { Card, CardContent } from "./ui/card";

const Footer = () => {
  return (
    <div className="fixed bottom-0 left-0 z-50 w-full">
      <Card className="rounded-none">
        <CardContent className="px-5 py-5">
          <p className="text-center text-sm">© 2024 Health Pep</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Footer;
