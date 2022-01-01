const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../constants.json');
const fs = require('fs');

const getNextReset = (currentDate) => {
  const nextReset = new Date();
  nextReset.setUTCHours(12);
  nextReset.setUTCMilliseconds(0);
  nextReset.setUTCMinutes(0);
  nextReset.setUTCSeconds(0);

  if (nextReset < currentDate) {
    nextReset.setDate(nextReset.getDate() + 1);
  }

  return Math.floor(nextReset.getTime() / 1000);
};

const createScheduleEmbed = (data) => {
  let currentDate = new Date();
  let nextReset = getNextReset(currentDate);
  let currentEventIdx = -1;
  let nextEventIdx = -1;

  for (let i = 0; i < data.length; i++) {
    if (Math.floor(data[i].closedAt / 1000) > Math.floor(currentDate / 1000) &&
      Math.floor(data[i].startAt / 1000) < Math.floor(currentDate / 1000)) {
      currentEventIdx = i;
    }
    if (Math.floor(data[i].startAt / 1000) > Math.floor(currentDate / 1000)) {
      if (nextEventIdx == -1) {
        nextEventIdx = i;
      } else if (Math.floor(data[i].startAt / 1000) < Math.floor(data[nextEventIdx].startAt / 1000)) {
        nextEventIdx = i;
      }
    }
  }

  let scheduleEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle('Event Schedule')
    .setDescription('')
    .addFields(
      { name: '**__Next Daily Reset__**', value: `<t:${nextReset}> - <t:${nextReset}:R>` },
      { name: '** **', value: '** **' },
    )
    .setTimestamp()
    .setFooter(FOOTER, 'https://i.imgur.com/AfFp7pu.png');

  if (currentEventIdx !== -1) {
    let startTime = Math.floor(data[currentEventIdx].startAt / 1000);
    let aggregateTime = Math.floor(data[currentEventIdx].aggregateAt / 1000);

    scheduleEmbed.addFields(
      { name: '**__Event (Current)__**', value: `${data[currentEventIdx].name} *[${data[currentEventIdx].eventType}]*` },
      { name: 'Event Started', value: `<t:${startTime}> - <t:${startTime}:R>` },
      { name: 'Ranking Closes', value: `<t:${aggregateTime}> - <t:${aggregateTime}:R>` },
    );
  }

  if (nextEventIdx !== -1) {
    if (currentEventIdx !== -1) { scheduleEmbed.addField('** **','** **');}

    let startTime = Math.floor(data[nextEventIdx].startAt / 1000);
    let aggregateTime = Math.floor(data[nextEventIdx].aggregateAt / 1000);

    scheduleEmbed.addFields(
      { name: '**__Event (Next)__**', value: `${data[nextEventIdx].name} *[${data[nextEventIdx].eventType}]*` },
      { name: 'Event Starts', value: `<t:${startTime}> - <t:${startTime}:R>` },
      { name: 'Ranking Closes', value: `<t:${aggregateTime}> - <t:${aggregateTime}:R>` },
    );
  }

  return scheduleEmbed;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Event Schedule Times'),
  
  async execute(interaction) {
    const schedule = JSON.parse(fs.readFileSync('./schedule.json'));
    const scheduleEmbed = createScheduleEmbed(schedule);
    await interaction.reply({ embeds: [scheduleEmbed] });
  }    
};