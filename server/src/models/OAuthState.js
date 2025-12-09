const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OAuthState = sequelize.define('OAuthState', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    state: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        comment: 'The state/nonce value for OAuth verification'
    },
    shop: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Shop domain initiating OAuth'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'When this state expires (typically 10 minutes)'
    },
    used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this state has been used (prevents replay attacks)'
    }
}, {
    tableName: 'oauth_states',
    timestamps: true,
    indexes: [
        {
            fields: ['state']
        },
        {
            fields: ['expiresAt']
        }
    ]
});

module.exports = OAuthState;
