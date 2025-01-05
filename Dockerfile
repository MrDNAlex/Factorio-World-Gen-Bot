FROM mrdnalex/factorioserver:latest

# Set the Node.js version
ENV NODE_VERSION=20.11.1

# Download and install Node.js
RUN cd /tmp \
    && curl -O https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz \
    && tar -xJf node-v$NODE_VERSION-linux-x64.tar.xz -C /usr/local --strip-components=1 \
    && rm node-v$NODE_VERSION-linux-x64.tar.xz

WORKDIR /home/factorio

# Make the Factorio Server Bot and Give Ownership to the Factorio User
RUN sudo mkdir /FactorioBot \
&& chown -R factorio:factorio /FactorioBot \
&& chmod -R 775 /FactorioBot

# Copy the Factorio Server Bot Files
COPY ./ /FactorioBot

# Set the working directory to /FactorioBot
WORKDIR /FactorioBot

# Run the Bot
CMD node index.js
