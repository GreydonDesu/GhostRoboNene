/**
 * @fileoverview Display a graph of the previous ranking trend
 * @author Potor10
 */

const { EmbedBuilder } = require('discord.js');
const { NENE_COLOR, FOOTER, LOCKED_EVENT_ID } = require('../../constants');
const https = require('https');

const COMMAND = require('../command_data/graph');

const generateSlashCommand = require('../methods/generateSlashCommand');
const generateEmbed = require('../methods/generateEmbed');
const getEventData = require('../methods/getEventData');

/**
 * Create a graph embed to be sent to the discord interaction
 * @param {string} graphUrl url of the graph we are trying to embed
 * @param {Integer} tier the ranking that the user wants to find
 * @param {DiscordClient} client we are using to interact with discord
 * @return {MessageEmbed} graph embed to be used as a reply via interaction
 */
const generateGraphEmbed = (graphUrl, tier, discordClient) => {
  const graphEmbed = new EmbedBuilder()
    .setColor(NENE_COLOR)
    .setTitle(`${tier} Nyaa~`)
    .setDescription(`**Requested:** <t:${Math.floor(Date.now() / 1000)}:R>`)
    .setThumbnail(discordClient.client.user.displayAvatarURL())
    .setImage(graphUrl)
    .setTimestamp()
    .setFooter({ text: FOOTER, iconURL: discordClient.client.user.displayAvatarURL() });

  return graphEmbed;
};

/**
 * Ensures a string is ASCII to be sent through HTML
 * @param {String} str the string to be converted to ASCII 
 * @returns 
 */
function ensureASCII(str) {
  return str.replace(/[^a-z0-9&]/gi, ' ');
}

/**
 * Operates on a http request and returns the url embed of the graph using quickchart.io
 * @param {Object} interaction object provided via discord
 * @param {Integer} tier the ranking that the user wants to find
 * @param {Object} rankData the ranking data obtained
 * @param {DiscordClient} client we are using to interact with discord
 * @error Status code of the http request
 */
const postQuickChart = async (interaction, tier, rankDatas, events, discordClient) => {
  if (!rankDatas) {
    await interaction.editReply({
      embeds: [
        generateEmbed({
          name: COMMAND.INFO.name,
          content: COMMAND.CONSTANTS.NO_DATA_ERR,
          client: discordClient.client
        })
      ]
    });
    return;
  }

  tier = ensureASCII(tier);
  for (let i = 0; i < rankDatas.length; i++) {
    rankDatas[i] = rankDatas[i].filter(point => point.timestamp < events[i].aggregateAt + 60 * 15 * 1000);
  }
  rankDatas = rankDatas.map((rankData, i) => {
    return rankData.map(point => {
      return {
        x: point.timestamp - events[i].startAt,
        y: point.score
      };
    });
  });

  let graphData = rankDatas.map((rankData, i) => {
    return {
      'type': 'line',
      'label': `${events[i].id}: ${events[i].name} ${tier}`,
      'fill': false,
      'pointRadius': 0,
      'data': rankData
    };
  });

  let postData = JSON.stringify({
    'backgroundColor': '#FFFFFF',
    'format': 'png',
    'chart': {
      'type': 'line',
      'data': {
        'datasets': graphData
      },
      'options': {
        'scales': {
          'xAxes': [{
            'type': 'time',
            'distribution': 'linear',
            'time': {
              'displayFormats': {
                'hour': '[Day] D HH'
              },
              'unit': 'hour',
              'stepSize': 3
            }
          }]
        }
      }
    }
  });

  const options = {
    host: 'quickchart.io',
    port: 443,
    path: '/chart/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    let json = '';
    res.on('data', (chunk) => {
      json += chunk;
    });
    res.on('end', async () => {
      if (res.statusCode === 200) {
        try {
          console.log(JSON.stringify(JSON.parse(json)));
          await interaction.editReply({
            embeds: [generateGraphEmbed(JSON.parse(json).url, tier, discordClient)]
          });
        } catch (err) {
          // Error parsing JSON: ${err}`
          console.log(`ERROR 1 ${err}`);
        }
      } else {
        // Error retrieving via HTTPS. Status: ${res.statusCode}
        console.log(`Error retrieving via HTTPS ${res.statusCode}`);
      }
    });
  }).on('error', () => { });

  req.write(postData);
  req.end();
};

async function noDataErrorMessage(interaction, discordClient) {
  let reply = 'Please input a tier in the range 1-100 or input 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 10000, 20000, 30000, 40000, or 50000';
  let title = 'Tier Not Found';

  await interaction.editReply({
    embeds: [
      generateEmbed({
        name: title,
        content: {
          'type': 'ERROR',
          'message': reply
        },
        client: discordClient.client
      })
    ]
  });
  return;
}

function getUserData(userId, event, discordClient) {
  let data = discordClient.cutoffdb.prepare('SELECT * FROM users ' +
    'WHERE (id=@id AND EventID=@eventID)').all({
      id: userId,
      eventID: event.id
    });
  data = data.map(x => ({ timestamp: x.Timestamp, score: x.Score }));
  data.unshift({ timestamp: event.startAt, score: 0 });
  return data;
}

function getTierData(tier, event, discordClient) {
  let data = discordClient.cutoffdb.prepare('SELECT * FROM cutoffs ' +
    'WHERE (Tier=@tier AND EventID=@eventID)').all({
      tier: tier,
      eventID: event.id
    });
  data = data.map(x => ({ timestamp: x.Timestamp, score: x.Score }));
  data.unshift({ timestamp: event.startAt, score: 0 });
  return data;
}

async function getTierPlayerData(tier, event, discordClient) {

  let data = discordClient.cutoffdb.prepare('SELECT ID, Score FROM cutoffs ' +
    'WHERE (EventID=@eventID AND Tier=@tier) ORDER BY TIMESTAMP DESC').all({
      eventID: event.id,
      tier: tier
    });

  if (data.length > 0) {
    let userId = data[0]['ID'];//Get the last ID in the list
    data = discordClient.cutoffdb.prepare('SELECT * FROM cutoffs ' +
      'WHERE (ID=@id AND EventID=@eventID)').all({
        id: userId,
        eventID: event.id
      });
    if (data.length > 0) {
      let rankData = data.map(x => ({ timestamp: x.Timestamp, score: x.Score }));
      rankData.unshift({ timestamp: event.startAt, score: 0 });
      rankData.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : (b.timestamp > a.timestamp) ? -1 : 0);

      return rankData;
    }
  }

  return [];
}

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),

  async execute(interaction, discordClient) {
    await interaction.deferReply({
      ephemeral: COMMAND.INFO.ephemeral
    });

    let event = discordClient.getCurrentEvent();

    const tier = interaction.options.getInteger('tier');
    const user = interaction.options.getMember('user');
    let events = interaction.options.getString('event') || [event];
    const graphTier = interaction.options.getBoolean('by_tier') || false;

    if (typeof (events) === 'string') {
      events = events.split(',').map(x => getEventData(parseInt(x)));
    }

    if (events.filter(x => x.id > 0).length === 0) {
      await interaction.editReply({
        embeds: [
          generateEmbed({
            name: COMMAND.INFO.name,
            content: COMMAND.CONSTANTS.NO_EVENT_ERR,
            client: discordClient.client
          })
        ]
      });
      return;
    }

    if (tier) {
      if (graphTier) {
        let data = events.map(event => getTierData(tier, event, discordClient));
        data = data.filter(x => x.length > 0);
        if (data.length === 0) {
          noDataErrorMessage(interaction, discordClient);
          return;
        }
        postQuickChart(interaction, `T${tier} Line Graph`, data, events, discordClient);
      } else {
        let data = events.map(event => getTierPlayerData(tier, event, discordClient));
        data = data.filter(x => x.length > 0);
        if (data.length === 0) {
          noDataErrorMessage(interaction, discordClient);
          return;
        }
        postQuickChart(interaction, `T${tier} Player Line Graph`, data, events, discordClient);
      }
    } else if (user) {
      try {
        if (event.id > LOCKED_EVENT_ID) {
          interaction.editReply({ content: `Event ID is past ${LOCKED_EVENT_ID}, User data is unable to be stored after this event and cannot be displayed` });
          return;
        }

        let id = discordClient.getId(user.id);

        if (id == -1) {
          interaction.editReply({ content: 'Discord User not found (are you sure that account is linked?)' });
          return;
        }

        let data = events.map(event => getUserData(id, event.id, discordClient));
        data = data.filter(x => x.length > 0);
        if (data.length > 0) {
          let name = user.displayName;
          postQuickChart(interaction, `${event.name} ${name} Event Points`, data, events, discordClient);
        }
        else {
          interaction.editReply({ content: 'Discord User found but no data logged (have you recently linked or event ended?)' });
        }
      } catch (err) {
        // Error parsing JSON: ${err}`
      }
    }
  }
};