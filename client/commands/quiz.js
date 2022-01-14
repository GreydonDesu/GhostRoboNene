const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { ERR_COMMAND, NENE_COLOR, FOOTER } = require('../../constants');
const fs = require('fs');

const COMMAND_NAME = 'quiz'

const generateDeferredResponse = require('../methods/generateDeferredResponse')
const generateEmbed = require('../methods/generateEmbed') 

const QUIZ_CONSTANTS = {
  'NO_RESPONSE': {
    type: 'Failed',
    message: 'There was no response within the alotted time. \nThe question was failed!'
  },

  'QUESTION_RIGHT': {
    type: 'Correct ✅',
    message: 'You have answered the question correctly!'
  },

  'QUESTION_WRONG': {
    type: 'Incorrect ❌',
    message: 'You have answered the question incorrectly!'
  },

  'LINK_MSG': 'Link an account to save your progress',

  "1": '1️⃣',
  "2": '2️⃣',
  "3": '3️⃣', 
  "4": '4️⃣'
};

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
const shuffle = (a) => {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
  }
  return a;
}

class eventQuestion {
  constructor() {
    this.type = 'events';
    this.events = JSON.parse(fs.readFileSync('./sekai_master/events.json'));
    this.prompts = require('../../quiz/event')
  }

  getType() {
    return this.type
  }

  getQuestion() {
    const idxArray = shuffle(this.events)

    const event = idxArray.pop()
    const wrong = [idxArray.pop().name, idxArray.pop().name, idxArray.pop().name]
    const questionIdx = Math.floor(Math.random() * this.prompts.length)

    const question = {
      right: event.name,
      wrong: wrong,
      prompt: this.prompts[questionIdx].prompt(event)
    }

    return question
  }
}

class characterQuestion {
  constructor() {
    this.type = 'characters';
    this.characterProfiles = JSON.parse(fs.readFileSync('./sekai_master/characterProfiles.json'));
    this.gameCharacters = JSON.parse(fs.readFileSync('./sekai_master/gameCharacters.json'));
    this.characterInfo = []

    for(let idx in this.characterProfiles) {
      this.characterInfo.push({
        ...this.gameCharacters[idx],
        ...this.characterProfiles[idx]
      })
    }

    this.prompts = require('../../quiz/characters')
  }

  getType() {
    return this.type
  }

  getQuestion() {
    const idxArray = shuffle(this.characterInfo)

    const getName = (character) => {
      let charName = character.givenName
      if (character.firstName) {
        charName += ` ${character.firstName}`
      }
      return charName
    }

    const wrong = []
    const questionIdx = Math.floor(Math.random() * this.prompts.length)
    const attr = this.prompts[questionIdx].attr

    const chooseCharacter = () => {
      const character = idxArray.pop()

      if (!character[attr]) { 
        return chooseQuestion(character) 
      } else {
        while (wrong.length < 3) {
          const incorrectChar = idxArray.pop()
          if (incorrectChar[attr] && incorrectChar[attr] !== character[attr]) {
            wrong.push(getName(incorrectChar))
          }
        }

        return {
          right: getName(character),
          wrong: wrong,
          prompt: this.prompts[questionIdx].prompt(character)
        }
      }
    }

    return chooseCharacter()
  }
}

class cardQuestion {
  constructor() {
    this.type = 'cards';
    this.cards = JSON.parse(fs.readFileSync('./sekai_master/cards.json'));
    this.gameCharacters = JSON.parse(fs.readFileSync('./sekai_master/gameCharacters.json'));
    this.cardInfo = []

    for(let idx in this.cards) {
      this.cardInfo.push({
        ...this.cards[idx],
        firstName: this.gameCharacters[this.cards[idx].characterId-1].firstName,
        givenName: this.gameCharacters[this.cards[idx].characterId-1].givenName,
      })
    }

    this.prompts = require('../../quiz/cards')
  }

  getType() {
    return this.type
  }

  getQuestion() {
    const idxArray = shuffle(this.cardInfo)

    const wrong = []
    const questionIdx = Math.floor(Math.random() * this.prompts.length)
    const attr = this.prompts[questionIdx].attr

    const chooseCard = () => {
      const card = idxArray.pop()

      while (wrong.length < 3) {
        const incorrectCard = idxArray.pop()
        if (incorrectCard[attr] !== card[attr]) {
          wrong.push(this.prompts[questionIdx].name(incorrectCard))
        }
      }

      return {
        right: this.prompts[questionIdx].name(card),
        wrong: wrong,
        prompt: this.prompts[questionIdx].prompt(card)
      }
    }

    return chooseCard()
  }
}

class areaQuestion {
  constructor() {
    this.type = 'cards';
    this.areas = JSON.parse(fs.readFileSync('./sekai_master/areas.json'));
    this.areaItems = JSON.parse(fs.readFileSync('./sekai_master/areaItems.json'));
    this.areaItemInfo = []

    for(let areaItemIdx in this.areaItems) {
      let areaName = 'N/A'
      for(let areaIdx in this.areas) {
        if (this.areas[areaIdx].id === this.areaItems[areaItemIdx].areaId) {
          areaName = this.areas[areaIdx].name
          break;
        }
      }

      this.areaItemInfo.push({
        ...this.areaItems[areaItemIdx],
        areaName: areaName
      })
    }

    this.prompts = require('../../quiz/areaItems')
  }

  getType() {
    return this.type
  }

  getQuestion() {
    const idxArray = shuffle(this.areaItemInfo)

    const wrong = []
    const questionIdx = Math.floor(Math.random() * this.prompts.length)
    const attr = this.prompts[questionIdx].attr

    const chooseAreaItem = () => {
      const areaItem = idxArray.pop()

      while (wrong.length < 3) {
        const incorrectAreaItem = idxArray.pop()
        if (incorrectAreaItem[attr] !== areaItem[attr]) {
          wrong.push(incorrectAreaItem[attr])
        }
      }

      return {
        right: areaItem[attr],
        wrong: wrong,
        prompt: this.prompts[questionIdx].prompt(areaItem)
      }
    }

    return chooseAreaItem()
  }
}


const createQuiz = async (deferredResponse, userId, account, discordClient) => {
  const questions = [new eventQuestion(), new characterQuestion(), new cardQuestion(), new areaQuestion()]

  const questionCreator = (questions[Math.floor(Math.random() * questions.length)])
  const question = questionCreator.getQuestion()

  const correctIdx = Math.floor(Math.random() * 3)
  const answerOrder = []
  
  let prompt = question.prompt + '\n'

  for(let i = 0; i < correctIdx; i++) {
    answerOrder.push(question.wrong.pop())
  }
  answerOrder.push(question.right)

  while(question.wrong.length) {
    answerOrder.push(question.wrong.pop())
  }

  for(let idx = 0; idx < answerOrder.length; idx++) {
    prompt += `${QUIZ_CONSTANTS[idx+1]} \`\`${answerOrder[idx]}\`\`\n`
  }

  const content = {
    type: questionCreator.getType(),
    message: prompt
  }

  await deferredResponse.edit({ 
    embeds: [generateEmbed(COMMAND_NAME, content, discordClient)]
  });

  deferredResponse.react(QUIZ_CONSTANTS[1])
    .then(() => deferredResponse.react(QUIZ_CONSTANTS[2]))
    .then(() => deferredResponse.react(QUIZ_CONSTANTS[3]))
    .then(() => deferredResponse.react(QUIZ_CONSTANTS[4]))
    .catch(err => console.log(err));

  const filter = (reaction, user) => {
    return [QUIZ_CONSTANTS[1], QUIZ_CONSTANTS[2], QUIZ_CONSTANTS[3], QUIZ_CONSTANTS[4]]
      .includes(reaction.emoji.name) && user.id === userId;
  };

  const createResultEmbed = (idx) => {
    let content = ERR_COMMAND
    let correct = (account.quiz_correct) ? account.quiz_correct : 0
    if (idx === correctIdx) {
      discordClient.db.prepare('UPDATE users SET quiz_correct=@quizCorrect WHERE discord_id=@discordId').run({
        quizCorrect: account.quiz_correct + 1,
        discordId: userId
      })
      content = { ...QUIZ_CONSTANTS.QUESTION_RIGHT }
      correct++
    } else {
      content = { ...QUIZ_CONSTANTS.QUESTION_WRONG }
    }

    if (account) {
      content.message += `\n\n Correct: \`\`${account.quiz_correct + 1}\`\``
      content.message += `\n Questions Answered: \`\`${account.quiz_question + 1}\`\``
    } else {
      content.message += `\n\n ${QUIZ_CONSTANTS.LINK_MSG}`
    }

    deferredResponse.edit({
      embeds: [generateEmbed(COMMAND_NAME, content, discordClient)]
    })
  }
  
  deferredResponse.awaitReactions({ filter, max: 1, time: 30000, errors: ['time'] })
    .then(collected => {
      const reaction = collected.first();
  
      switch(reaction.emoji.name) {
        case QUIZ_CONSTANTS[1]:
          createResultEmbed(0)
          break
        case QUIZ_CONSTANTS[2]:
          createResultEmbed(1)
          break
        case QUIZ_CONSTANTS[3]:
          createResultEmbed(3)
          break
        case QUIZ_CONSTANTS[4]:
          createResultEmbed(4)
          break
      }
    })
    .catch(collected => {
      const content = { ... QUIZ_CONSTANTS.NO_RESPONSE }
      if (account) {
        content.message += `\n\n Correct: \`\`${account.quiz_correct}\`\``
        content.message += `\n Questions Answered: \`\`${account.quiz_question + 1}\`\``
      } else {
        content.message += `\n\n ${QUIZ_CONSTANTS.LINK_MSG}`
      }

      deferredResponse.edit({
        embeds: [generateEmbed(COMMAND_NAME, content, discordClient)]
      })
    });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Fun Project Sekai Quiz'),
  
  async execute(interaction, discordClient) {
    const deferredResponse = await interaction.reply({
      embeds: [generateDeferredResponse(COMMAND_NAME, discordClient)],
      fetchReply: true
    })

    const user = discordClient.db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
      discordId: interaction.user.id
    })

    let account = null
    if (user.length) {
      account = user[0]
      discordClient.db.prepare('UPDATE users SET quiz_question=@quizQuestion WHERE discord_id=@discordId').run({
        quizQuestion: account.quiz_question + 1,
        discordId: interaction.user.id
      })
    }

    createQuiz(deferredResponse, interaction.user.id, account, discordClient)
  }
}