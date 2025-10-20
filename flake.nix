{
  description = "A Nix-flake-based development environment";

  inputs.nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0";

  outputs =
    {
      self,
      nixpkgs,
      ...
    }@inputs:
    let
      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forEachSupportedSystem =
        f:
        nixpkgs.lib.genAttrs supportedSystems (
          system:
          f {
            pkgs = import nixpkgs { inherit system; };
            inherit system; # Pass system as part of the argument set
          }
        );
    in
    {
      devShells = forEachSupportedSystem (
        {
          system,
          pkgs,
        }:
        {
          # Add system to the destructured parameters
          default = pkgs.mkShell {
            packages = with pkgs; [
              uv
nodePackages.vercel
            ];
            shellHook = ''
              source .venv/bin/activate
              python --version
            '';
          };
        }
      );
    };
}
