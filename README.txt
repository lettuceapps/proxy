# installation
npm install

# config
cp config/development.json.sample config/development.json

# run dev
sudo node server.js
sudo grunt server

# run prod
sudo NODE_ENV=production node server.js


# debug
sudo npm install -g node-inspector
sudo node --debug server.js



############################################################################
## see admin project/configs/proxy/README.txt for server configurations
############################################################################

# local VM
sudo mkdir /var/www
sudo chown www-data:www-data /var/www/
cd /var/www
sudo -u www-data ln -sfn [proxy-project]/proxy


# startup / as an upstart sevice

# forever
sudo npm install -g forever

# for local
sudo ln -sfn /[admin-project]]/configs/proxy/init/proxy.conf /etc/init

# sudo start proxy
# sudo stop proxy