{
  description = "A sample Flake for Home Assistant with Python 3.12 & uv";

  inputs = {
    nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/*";
    flake-utils.url = "github:numtide/flake-utils";
  };

outputs = { self, nixpkgs, flake-utils, ... }:
  flake-utils.lib.eachDefaultSystem (system:
    let
      pkgs = import nixpkgs {
        inherit system;
        overlays = [];
      };
    in
    {
      devShell = pkgs.mkShell {
        buildInputs = [
          pkgs.uv
        ];
         shellHook = ''
          # Start the virtual environment
	  source .venv/bin/activate
	  echo -e "\033[1;36mPython:\033[0m $(python --version 2>&1)"
          '';
        };      
    });
}


