Everything related to CI/CD is included in the file ".gitlab-ci.yml"
CI works automatically in every branch. Package & deployment stages only works on main branch. WHILE PUSHING TO THE MAIN BRANCH ONE SHOULD START THE DEPLOYENT STAGE MANUALLY FOR SECURITY RESONS.
For further questions : YAVUZ

--------------------------------------------------------------
more info follows

The continues integration process works on both client and the server code. It is made of 3 stages for both server and client: check, test, build.
    "server:check" : uses a node.js container and installs the dependencies in the package-lock.json and checks if the code can pass the typescript checks in a clean enviroment.
    "client:check" : uses grandle wrapper to create a clean enviroment and checks if the client code can pass the verification checks.
    "server:test"  : installs the dependencies from package-lock.json and runnst the server test suite
    "client:test"  : uses Grandle wrapper and runns the VM/unit tests for the Android project
    "server:build" : installs the dependencies from package-lock.json and runns the build script there
    "client:build" : uses Grabdle wrapper and runns the full android build

the continues deployment runns only on main branch and only on server. It includes two stages : package, deploy.
    "server:package" : uses kaniko image to build Docker images withput docker deamon (docker in docker not allowed in our project) and uses CI registery credentials so kanika can push to gitlab container registery. Builds the image from server/dockerfile using kaniko executer and pushes to the registery.
    "server:deploy"  : installs SSH client in CI container and prepares the SSH access. Removes old contanier on the server and starts the new one deploying to the deploy path.

I wrote this stuff without AI btw (flex) thanks for reading