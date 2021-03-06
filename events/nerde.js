const { ApiKeys } = require('../db');
const axios = require("axios");
const nerdeEmbed = require('../embeds/nerde_embed')

module.exports = {
    name: 'messageCreate',
    async execute(interaction) {
        let messageArr = interaction.content.split(" ")
        if (messageArr[messageArr.length - 1] === "nerde" || messageArr[messageArr.length - 1] === "nerede") {
            messageArr.pop()

            if (!messageArr.length) return

            const showName = messageArr.join(" ")

            let groupData, showData

            const msg = await interaction.channel.send({ content: 'https://i.imgur.com/T9qCrmB.gif' });

            const group = await ApiKeys.findOne({
                where: {
                    discordGuildId: interaction.guild.id
                }
            })

            if (!group) {
                return await msg.edit({ content: `Discord sunucunuzla eşleşmiş bir API key bulunamadı. Lütfen /set komutuyla eşleştirme yapın.`, ephemeral: true });
            }

            if (!showName) {
                return await msg.edit({ content: `Bölüm detaylarına bakmak için seri ismini girmeniz gerekiyor.`, ephemeral: true });
            }

            try {
                groupData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}.json`)
                showData = await axios.get(`${process.env.DESCHTIMES_API_PATH}/groups/${group.deschtimesApiKey}/shows/${showName}.json`)
            } catch (err) {
                return await msg.edit({ content: err?.response?.data?.message || `Bilgileri alırken bir sorunla karşılaştık.`, ephemeral: true });
            }

            let fEpisode = showData.data.episodes.find(show => !show.released)
            if (!fEpisode?.id && !showData.data.episodes[showData.data.episodes.length - 1].released) {
                return await msg.edit({ content: `İstediğiniz bölüm bulunamadı.`, ephemeral: true });
            } else if (!fEpisode?.id) {
                fEpisode = showData.data.episodes[showData.data.episodes.length - 1]
            }


            const { data } = showData
            for (let episode in data.episodes) {
                if (data.episodes[episode].number == fEpisode.number) {
                    const episodeData = data.episodes[episode]

                    const groupEmbed = nerdeEmbed({ data, episodeData, groupData, interaction })
                    return await msg.edit({
                        content: "-", embeds: [groupEmbed]
                    });
                }
            }
            return await msg.edit({ content: `Aradığınız bölüm detaylarına ulaşılamadı.` });
        }
    },
};