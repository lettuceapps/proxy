# installation
npm install

# config
cp config/development.json.sample config/development.json

# run dev
sudo node server.js
(new run) sudo grunt server

# run prod
sudo NODE_ENV=production node server.js


# debug
sudo npm install -g node-inspector
sudo node --debug server.js
