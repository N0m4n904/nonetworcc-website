{
  description = "The Python that computes the drawing of the car";

  # The revision of nixpkgs whose numpy and scipy wrote the committed
  # geometry: Python 3.14.7, numpy 2.5.2 and scipy 1.18.1. flake.lock has
  # its checksum. Another revision can move single numbers of the geometry.
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/6774f7bc253789b113a4f39285dc0fa100abeacc";

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
    in
    {
      # `nix run path:tools/car -- -m tools.car`, which is `npm run car`,
      # starts this Python in the folder it is called from.
      apps = nixpkgs.lib.genAttrs systems (system: {
        default = {
          type = "app";
          program = nixpkgs.lib.getExe (
            nixpkgs.legacyPackages.${system}.python3.withPackages (packages: [
              packages.numpy
              packages.scipy
            ])
          );
        };
      });
    };
}
