{
  description = "A Nix-flake-based development environment";

  inputs.nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0";

  inputs.pre-commit-hooks = {
    url = "github:cachix/git-hooks.nix";
    inputs.nixpkgs.follows = "nixpkgs";
  };

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
      checks = forEachSupportedSystem (
        {
          system,
          pkgs,
        }:
        {
          pre-commit-check = inputs.pre-commit-hooks.lib.${system}.run {
            src = ./.;
            hooks = {
              ruff = {
                enable = true;
              };
              ruff-format = {
                enable = true;
              };
              # selene.enable = true;
            };
          };
        }
      );

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
              ${self.checks.${system}.pre-commit-check.shellHook}
            '';
            buildInputs = self.checks.${system}.pre-commit-check.enabledPackages;
          };
        }
      );
    };
}
