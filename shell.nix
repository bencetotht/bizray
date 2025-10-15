{
  pkgs ? import <nixpkgs> { },
}:

pkgs.mkShell {
  buildInputs = [
    pkgs.python3
    pkgs.python3Packages.django
    pkgs.python313Packages.fastapi-cli
  ];

  shellHook = '''';
}
