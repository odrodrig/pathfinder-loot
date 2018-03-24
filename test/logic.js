'use strict';
/**
 * Write the unit tests for your transction processor functions here
 */

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const IdCard = require('composer-common').IdCard;
const MemoryCardStore = require('composer-common').MemoryCardStore;

const path = require('path');

require('chai').should();

const namespace = 'org.ibm.pathfinder';

describe('#' + namespace, () => {
    // In-memory card store for testing so cards are not persisted to the file system
    const cardStore = new MemoryCardStore();
    let adminConnection;
    let businessNetworkConnection;

    before(() => {
        // Embedded connection used for local testing
        const connectionProfile = {
            name: 'embedded',
            type: 'embedded'
        };
        // Embedded connection does not need real credentials
        const credentials = {
            certificate: 'FAKE CERTIFICATE',
            privateKey: 'FAKE PRIVATE KEY'
        };

        // PeerAdmin identity used with the admin connection to deploy business networks
        const deployerMetadata = {
            version: 1,
            userName: 'PeerAdmin',
            roles: [ 'PeerAdmin', 'ChannelAdmin' ]
        };
        const deployerCard = new IdCard(deployerMetadata, connectionProfile);
        deployerCard.setCredentials(credentials);

        const deployerCardName = 'PeerAdmin';
        adminConnection = new AdminConnection({ cardStore: cardStore });

        return adminConnection.importCard(deployerCardName, deployerCard).then(() => {
            return adminConnection.connect(deployerCardName);
        });
    });

    beforeEach(() => {
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });

        const adminUserName = 'admin';
        let adminCardName;
        let businessNetworkDefinition;

        return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..')).then(definition => {
            businessNetworkDefinition = definition;
            // Install the Composer runtime for the new business network
            return adminConnection.install(businessNetworkDefinition.getName());
        }).then(() => {
            // Start the business network and configure an network admin identity
            const startOptions = {
                networkAdmins: [
                    {
                        userName: adminUserName,
                        enrollmentSecret: 'adminpw'
                    }
                ]
            };
            return adminConnection.start(businessNetworkDefinition, startOptions);
        }).then(adminCards => {
            // Import the network admin identity for us to use
            adminCardName = `${adminUserName}@${businessNetworkDefinition.getName()}`;
            return adminConnection.importCard(adminCardName, adminCards.get(adminUserName));
        }).then(() => {
            // Connect to the business network using the network admin identity
            return businessNetworkConnection.connect(adminCardName);
        });
    });

    describe('CreateCampaign()', () => {
        it('Campaign should be created by testPlayer', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            var campaignControl;
            campaignControl.campaignName = "Test Campaign";
            campaignControl.desc = "This is a test campaign description";
            campaignControl.private = false;
            campaignControl.maxPlayers = 5;
            campaignControl.restrictions[0] = "No gunslingers!";
            campaignControl.location = "Virtual";
            campaignControl.GM = 

            // Create a gm participant
            const gm = factory.newResource(namespace, 'Player', 'A1234');
            gm.username = "testGM";
            gm.firstName = "Oliver";
            gm.lastName = "Rodriguez";
            gm.phoneNumber = "5555555555";

            // Create a user participant
            const user = factory.newResource(namespace, 'Player', 'B4567');
            user.username = "testPlayer";
            user.firstName = "John";
            user.lastName = "Doe";
            user.phoneNumber = "5556666666";

            // Create a transaction to change the asset's value property
            const createCampaign = factory.newTransaction(namespace, 'campaignCreation');
            campaignCreation.GM = factory.newRelationship(namespace, Player, gm.$identifier);
            campaignCreation.campaignName = 'Test Campaign';
            campaignCreation.campaignDesc = "This is a test campaign description";
            campaignCreation.isPrivate = false;
            campaignCreation.restrictions.push("No gunslingers!");
            campaignCreation.maxPlayers = 5;
            campaignCreation.location = "Virtual";
            campaignCreation.players.push(user);

            return businessNetworkConnection.getParticipantRegistry(namespace + '.Player');
            }).then(userRegistry => {
                // Add the user to the appropriate participant registry
                return userRegistry.addAll([gm,user]);
            }).then(() => {
                // Submit the transaction
                return businessNetworkConnection.submitTransaction(campaignCreation);
            }).then(() => {
                // Get the asset
                return businessNetworkConnection.getAssetRegistry(namespace + '.Campaign');
            }).then(campaignRegistry => {

                return campaignRegistry.getAll();
            }).then(campaigns => {
                console.log(campaigns);
                console.log("_----------_");
                console.log(campaigns[0]);


            });
        });
    });

    describe('ChangeAssetValue()', () => {
        it('should change the value property of ' + assetType + ' to newValue', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // Create a user participant
            const user = factory.newResource(namespace, 'User', 'Oliver Rodriguez');

            // Create the asset
            const asset = factory.newResource(namespace, assetType, 'ASSET_001');
            asset.value = 'old-value';

            // Create a transaction to change the asset's value property
            const changeAssetValue = factory.newTransaction(namespace, 'ChangeAssetValue');
            changeAssetValue.relatedAsset = factory.newRelationship(namespace, assetType, asset.$identifier);
            changeAssetValue.newValue = 'new-value';

            let assetRegistry;

            return businessNetworkConnection.getAssetRegistry(namespace + '.' + assetType).then(registry => {
                assetRegistry = registry;
                // Add the asset to the appropriate asset registry
                return registry.add(asset);
            }).then(() => {
                return businessNetworkConnection.getParticipantRegistry(namespace + '.User');
            }).then(userRegistry => {
                // Add the user to the appropriate participant registry
                return userRegistry.add(user);
            }).then(() => {
                // Submit the transaction
                return businessNetworkConnection.submitTransaction(changeAssetValue);
            }).then(registry => {
                // Get the asset
                return assetRegistry.get(asset.$identifier);
            }).then(newAsset => {
                // Assert that the asset has the new value property
                newAsset.value.should.equal(changeAssetValue.newValue);
            });
        });
    });

});
