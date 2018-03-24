'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * Creating a campaign
 * @param {org.ibm.pathfinder.createCampaign} tx
 * @transaction
 */
function createCampaign(tx) {

    var factory = getFactory();
    var campaign = factory.newResource('org.ibm.pathfinder', 'Campaign',Math.random().toString(36).substring(3));

    campaign.GM = tx.GM;
    campaign.campaignName = tx.campaignName;
    campaign.desc = tx.campaignDesc;
    campaign.private = tx.isPrivate;
    campaign.maxPlayers = tx.maxPlayers;
    campaign.location = tx.location;

    if (tx.restrictions) {
        campaign.restrictions = tx.restrictions;
    }

    if (tx.players) {
        campaign.nonGM_players = tx.players;
    }

    return  getAssetRegistry('org.ibm.pathfinder.Campaign')
            .then(function(campaignRegistry) {
            return campaignRegistry.add(campaign);
            });
}

/**
 * Adding players to campaign
 * @param {org.ibm.pathfinder.addToCampaign} tx
 * @transaction
 */
function addToCampaign(tx) {

    var campaign = tx.campaign;

    if (tx.playersToAdd.length() = 0) {
        throw new Error('No players to add');
    }
    
    tx.playersToAdd.foreach(function(player) {
        if (campaign.nonGM_players.includes(player)) {
            throw new Error('Player already exists in campaign');
        } else {
            campaign.nonGM_players.push(player);
        }
    });

    return  getAssetRegistry('org.ibm.pathfinder.Campaign')
            .then(function(campaignRegistry) {
            return campaignRegistry.update(campaign);
            });
}

/**
 * Creating a vote to kick
 * @param {org.ibm.pathfinder.kickPlayer} tx
 * @transaction
 */
function kickPlayer(tx) {

    var campaign = tx.campaign;
    var voteID = tx.playerToKick.playerID + "-" + campaign.campID;

    var index = campaign.nonGM_players.indexOf(tx.playerToKick);
                    
    if (index == -1) {
        throw new Error('Player does not exist in campaign');
    }

    return  getAssetRegistry('org.ibm.pathfinder.VoteToKick')
        .then(function(voteRegistry) {
            return voteRegistry.exists(voteID)
                .then(function(exists) {

                    if (exists) {
                        voteRegistry.get(voteID)
                        .then(function(existingVote) {
                            existingVote.votes++;

                            if (existingVote.votes >= (campaign.nonGM_players.length()/2)) {

                                campaign.nonGM_players.splice(index, 1);
                                campaign.kickedPlayers.push(tx.playerToKick);
                                existingVote.status = "closed";

                                return  getAssetRegistry('org.ibm.pathfinder.Campaign')
                                    .then(function(campaignRegistry) {
                                        return campaignRegistry.update(campaign);
                                    });

                            }
                            return voteRegistry.update(existingVote);
                        });


                    } else {

                        var factory = getFactory();
                        var voteToKick = factory.newResource('org.ibm.pathfinder', 'VoteToKick', voteID);
                    
                        voteToKick.status = "open";
                        voteToKick.playerToKick = tx.playerToKick;
                        voteToKick.campaign = campaign;
                        voteToKick.votes = 1;
                        voteToKick.reason = tx.reason;

                        return voteRegistry.add(voteToKick);

                    }
                });
        });

}

/**
 * Creating a petition to ban a player
 * @param {org.ibm.pathfinder.petitionToBanPlayer} tx
 * @transaction
 */
function petitionToBanPlayer(tx) {

    var campaign = tx.campaign;
    var petitionID = ("p-"+tx.playerToBan.playerID);

    return  getAssetRegistry('org.ibm.pathfinder.PetitionToBan')
        .then(function(petitionRegistry) {
            return petitionRegistry.exists(petitionID)
                .then(function(exists) {

                    if (exists) {
                        petitionRegistry.get(petitionID)
                        .then(function(existingPetition) {
                            existingPetition.votes.push(tx.reporter);

                            if (existingVote.votes.length() == 3 ) {

                                existingPetition.status = "closed";
                                tx.playerToBan.isBanned = true;
                                tx.playerToBan.reports.push(
                                    "Banned for: "+ tx.reason
                                );

                                return  getAssetRegistry('org.ibm.pathfinder.Player')
                                    .then(function(playerRegistry) {
                                        return playerRegistry.update(tx.playerToBan);
                                    });

                            }
                            return petitionRegistry.update(existingPetition);
                        });


                    } else {

                        var factory = getFactory();
                        var petitionToBan = factory.newResource('org.ibm.pathfinder', 'PetitionToBan', petitionID);
                    
                        petitionToBan.status = "open";
                        petitionToBan.playerToKick = tx.playerToKick;
                        petitionToBan.votes.push(tx.reporter);
                        petitionToBan.reason = tx.reason;

                        return petitionRegistry.add(petitionToBan);

                    }
                });
        });

}

/**
 * Give loot transaction
 * @param {org.ibm.pathfinder.giveLoot} tx
 * @transaction
 */
function giveLoot(tx) {

    var campaign = tx.campaign;

    tx.loot.foreach(function(item) {
        campaign.availableLoot.push(item);
    })

    return  getAssetRegistry('org.ibm.pathfinder.Campaign')
            .then(function(campaignRegistry) {
            return campaignRegistry.update(campaign);
            });
}

/**
 * removeCharacter transaction
 * @param {org.ibm.pathfinder.removeCharacter} tx
 * @transaction
 */
function removeCharacter(tx) {

    return  getAssetRegistry('org.ibm.pathfinder.Character')
            .then(function(characterRegistry) {
            return characterRegistry.remove(tx.characterToRemobe);
            });
}

/**
 * reportUser transaction
 * @param {org.ibm.pathfinder.reportUser} tx
 * @transaction
 */
function reportUser(tx) {

    var reportID = (tx.playerToReport.username + tx.playerToReport.reports.length());

    var factory = getFactory();
    var report = factory.newResource('org.ibm.pathfinder', 'Report', reportID);

    report.playerReported = tx.playerToReport;
    report.reason = tx.reason;

    tx.playerToReport.reports.push(report);

    return  getAssetRegistry('org.ibm.pathfinder.Report')
            .then(function(reportRegistry) {
            return reportRegistry.add(report);
            });

    if (tx.playerToReport.getFullyQualifiedType == "org.ibm.pathfinder.Player") {

        return  getAssetRegistry('org.ibm.pathfinder.Player')
            .then(function(reportRegistry) {
            return reportRegistry.update(report);
        });
    } else if (tx.playerToReport.getFullyQualifiedType == "org.ibm.pathfinder.Moderator") {

        return  getAssetRegistry('org.ibm.pathfinder.Moderator')
            .then(function(ModeratorRegistry) {
            return ModeratorRegistry.update(report);
        });
        
    }


}