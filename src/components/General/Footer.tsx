const Footer = () => {
  return (
    <footer className="bg-slate-deep text-white">
      <div className="py-8">
          <p className="text-center text-slate-light">
            © {new Date().getFullYear()} Slates. All rights reserved.
          </p>
      </div>
    </footer>
  );
};

export default Footer;