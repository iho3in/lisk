/*
 * Copyright © 2018 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 */
'use strict';/*eslint*/

var crypto = require('crypto');
var rewire = require('rewire');

var ed = require('../../../helpers/ed');
var constants = require('../../../helpers/constants');
var slots = require('../../../helpers/slots');
var typesRepresentatives = require('../../fixtures/typesRepresentatives');

var InTransfer = rewire('../../../logic/inTransfer.js');

var modulesLoader = require('../../common/modulesLoader');

var validPassword = 'robust weapon course unknown head trial pencil latin acid';
var validKeypair = ed.makeKeypair(crypto.createHash('sha256').update(validPassword, 'utf8').digest());

var validSender = {
	balance: '0',
	password: 'zdv72jrts9y8613e4s4i',
	secondPassword: '33ibzztls7xlrocpzxgvi',
	username: '9bzuu',
	publicKey: '967e00fbf215b6227a6521226decfdc14c92cb88d35268787a47ff0e6b92f94a',
	address: '17603529232728446942L',
	secondPublicKey: 'b9aa5c8d1e1cbcf97eb6393cda8315b7d35cecbc8e2eb0629fa3cf80df4cdda7'
};

var senderHash = crypto.createHash('sha256').update(validSender.password, 'utf8').digest();
var senderKeypair = ed.makeKeypair(senderHash);

var validTransaction =  {
	id: '2273003018673898961',
	height: 843,
	blockId: '11870363750006389009',
	type: 6,
	timestamp: 40420761,
	senderPublicKey: '6dc3f3f8bcf9fb689a1ec6703ed08c649cdc98619ac4689794bf72b579d6cf25',
	requesterPublicKey: undefined,
	senderId: '2623857243537009424L',
	recipientId: null,
	recipientPublicKey: null,
	amount: 999,
	fee: 10000000,
	signature: '46b57a56f3a61c815224e4396c9c39316ca62568951f84c2e7404225cf67c489f517db6a848a0a5fd4f311b98102c36098543cecb277c7d039a07ed069d90b0b',
	signSignature: undefined,
	signatures: [],
	confirmations: 113,
	asset: {
		inTransfer:{
			dappId: '7400202127695414450'
		}
	}
};

var rawValidTransaction = {
	t_id: '2273003018673898961',
	b_height: 843,
	t_blockId: '11870363750006389009',
	t_type: 6,
	t_timestamp: 40420761,
	t_senderPublicKey: '6dc3f3f8bcf9fb689a1ec6703ed08c649cdc98619ac4689794bf72b579d6cf25',
	m_recipientPublicKey: null,
	t_senderId: '2623857243537009424L',
	t_recipientId: null,
	t_amount: '999',
	t_fee: '10000000',
	t_signature: '46b57a56f3a61c815224e4396c9c39316ca62568951f84c2e7404225cf67c489f517db6a848a0a5fd4f311b98102c36098543cecb277c7d039a07ed069d90b0b',
	t_SignSignature: null,
	t_signatures: null,
	confirmations: 113,
	in_dappId: '7400202127695414450'
};

var validGetGensisResult = {
	authorId: 'validAuthorId'
};

describe('inTransfer', function () {

	var inTransfer;
	var dbStub;
	var sharedStub;
	var accountsStub;
	var blocksStub;

	var trs;
	var rawTrs;
	var sender;
	var dummyBlock;

	beforeEach(function () {
		dbStub = {
			dapps: {
				countByTransactionId: sinonSandbox.stub().resolves(),
				countByOutTransactionId: sinonSandbox.stub().resolves(),
				getExisting: sinonSandbox.stub().resolves(),
				list: sinonSandbox.stub().resolves(),
				getGenesis: sinonSandbox.stub().resolves()
			}
		};
		sharedStub = {
			getGenesis: sinonSandbox.stub().callsArgWith(1, null, validGetGensisResult)
		};
		accountsStub = {
			mergeAccountAndGet: sinonSandbox.stub().callsArg(1),
			getAccount: sinonSandbox.stub()
		};
		dummyBlock = {
			id: '9314232245035524467',
			height: 1
		};
		blocksStub = {
			lastBlock: {
				get: sinonSandbox.stub().returns(dummyBlock)
			}
		};
		inTransfer = new InTransfer(dbStub, modulesLoader.scope.schema);
		inTransfer.bind(accountsStub, blocksStub, sharedStub);
	});

	beforeEach(function () {
		trs = _.cloneDeep(validTransaction);
		rawTrs = _.cloneDeep(rawValidTransaction);
		sender = _.cloneDeep(validSender);
		dummyBlock = {
			id: '9314232245035524467',
			height: 1
		};
	});

	describe('constructor', function () {

		describe('library', function () {

			var library;

			beforeEach(function () {
				new InTransfer(dbStub, modulesLoader.scope.schema);
				library = InTransfer.__get__('library');
			});

			it('should assign db', function () {
				expect(library).to.have.property('db').eql(dbStub);
			});

			it('should assign schema', function () {
				expect(library).to.have.property('schema').eql(modulesLoader.scope.schema);
			});
		});
	});

	describe('bind', function () {

		var modules;
		var shared;

		beforeEach(function () {
			inTransfer.bind(accountsStub, blocksStub, sharedStub);
			modules = InTransfer.__get__('modules');
			shared = InTransfer.__get__('shared');
		});

		describe('modules', function () {

			it('should assign accounts', function () {
				expect(modules).to.have.property('accounts').eql(accountsStub);
			});

			it('should assign blocks', function () {
				expect(modules).to.have.property('blocks').eql(blocksStub);
			});
		});

		it('should assign shared', function () {
			expect(shared).to.eql(sharedStub);
		});
	});

	describe('calculateFee', function () {

		it('should return constants.fees.send', function () {
			expect(inTransfer.calculateFee(trs)).to.equal(constants.fees.send);
		});
	});

	describe('verify', function () {

		var modules;

		beforeEach(function () {
			inTransfer.bind(accountsStub, blocksStub, sharedStub);
		});

		describe('when trs.recipientId exists', function () {

			it('should call callback with error = "Transaction type 6 is frozen"', function (done) {
				trs.recipientId = '4835566122337813671L';
				inTransfer.verify(trs, sender, function (err) {
					expect(err).to.equal('Transaction type 6 is frozen');
					done();
				});
			});
		});

		describe('when trs.amount does not exist', function () {

			it('should call callback with error = "Transaction type 6 is frozen"', function (done) {
				trs.amount = undefined;
				inTransfer.verify(trs, sender, function (err) {
					expect(err).to.equal('Transaction type 6 is frozen');
					done();
				});
			});
		});

		describe('when trs.amount = 0', function () {

			it('should call callback with error = "Transaction type 6 is frozen"', function (done) {
				trs.amount = 0;
				inTransfer.verify(trs, sender, function (err) {
					expect(err).to.equal('Transaction type 6 is frozen');
					done();
				});
			});
		});

		describe('when trs.asset does not exist', function () {

			it('should call callback with error = "Transaction type 6 is frozen"', function (done) {
				trs.asset = undefined;
				inTransfer.verify(trs, sender, function (err) {
					expect(err).to.equal('Transaction type 6 is frozen');
					done();
				});
			});
		});

		describe('when trs.asset.inTransfer does not exist', function () {

			it('should call callback with error = "Transaction type 6 is frozen"', function (done) {
				trs.asset.inTransfer = undefined;
				inTransfer.verify(trs, sender, function (err) {
					expect(err).to.equal('Transaction type 6 is frozen');
					done();
				});
			});
		});

		describe('when trs.asset.inTransfer = 0', function () {

			it('should call callback with error = "Transaction type 6 is frozen"', function (done) {
				trs.asset.inTransfer = 0;
				inTransfer.verify(trs, sender, function (err) {
					expect(err).to.equal('Transaction type 6 is frozen');
					done();
				});
			});
		});

		it('should call library.db.dapps.countByTransactionId', function (done) {
			inTransfer.verify(trs, sender, function () {
				expect(dbStub.dapps.countByTransactionId.calledOnce).to.be.false;
				done();
			});
		});

		it('should call library.db.dapps.countByTransactionId with trs.asset.inTransfer.dappId', function (done) {
			inTransfer.verify(trs, sender, function () {
				expect(dbStub.dapps.countByTransactionId.calledWith(trs.asset.inTransfer.dappId)).to.be.false;
				done();
			});
		});

		it('should call library.db.dapps.countByTransactionId with trs.asset.inTransfer.dappId', function (done) {
			inTransfer.verify(trs, sender, function () {
				expect(dbStub.dapps.countByTransactionId.calledWith(trs.asset.inTransfer.dappId)).to.be.false;
				done();
			});
		});

		describe('when library.db.one fails', function () {

			beforeEach(function () {
				dbStub.dapps.countByTransactionId = sinonSandbox.stub().rejects('Rejection error');
			});

			it('should call callback with error', function (done) {
				inTransfer.verify(trs, sender, function (err) {
					expect(err).not.to.be.empty;
					done();
				});
			});
		});

		describe('when library.db.one succeeds', function () {

			describe('when dapp does not exist', function () {

				beforeEach(function () {
					dbStub.dapps.countByTransactionId = sinonSandbox.stub().resolves(0);
				});

				it('should call callback with error = "Transaction type 6 is frozen"', function (done) {
					inTransfer.verify(trs, sender, function (err) {
						expect(err).to.equal('Transaction type 6 is frozen');
						done();
					});
				});
			});

			describe('when dapp exists', function () {

				beforeEach(function () {
					dbStub.dapps.countByTransactionId = sinonSandbox.stub().resolves(1);
				});

				it('should call callback with error = "Transaction type 6 is frozen"', function (done) {
					inTransfer.verify(trs, sender, function (err) {
						expect(err).to.equal('Transaction type 6 is frozen');
						done();
					});
				});

				it('should call callback with result = undefined', function (done) {
					inTransfer.verify(trs, sender, function (err, res) {
						expect(res).to.be.undefined;
						done();
					});
				});
			});
		});
	});

	describe('process', function () {

		it('should call callback with error = null', function (done) {
			inTransfer.process(trs, sender, function (err) {
				expect(err).to.be.null;
				done();
			});
		});

		it('should call callback with result = transaction', function (done) {
			inTransfer.process(trs, sender, function (err, result) {
				expect(result).to.eql(trs);
				done();
			});
		});
	});

	describe('getBytes', function () {

		describe('when trs.asset.inTransfer.dappId = undefined', function () {

			beforeEach(function () {
				trs.asset.inTransfer.dappId = undefined;
			});

			it('should throw', function () {
				expect(inTransfer.getBytes.bind(null, trs)).to.throw;
			});
		});

		describe('when trs.asset.inTransfer.dappId is a valid dapp id', function () {

			it('should not throw', function () {
				expect(inTransfer.getBytes.bind(null, trs)).not.to.throw;
			});

			it('should get bytes of valid transaction', function () {
				expect(inTransfer.getBytes(trs).toString('utf8')).to.equal(validTransaction.asset.inTransfer.dappId);
			});

			it('should return result as a Buffer type', function () {
				expect(inTransfer.getBytes(trs)).to.be.instanceOf(Buffer);
			});
		});
	});

	describe('apply', function () {

		beforeEach(function (done) {
			inTransfer.apply(trs, dummyBlock, sender, done);
		});

		it('should call shared.getGenesis', function () {
			expect(sharedStub.getGenesis.calledOnce).to.be.true;
		});

		it('should call shared.getGenesis with {dappid: trs.asset.inTransfer.dappId}', function () {
			expect(sharedStub.getGenesis.calledWith({dappid: trs.asset.inTransfer.dappId})).to.be.true;
		});

		describe('when shared.getGenesis fails', function () {

			beforeEach(function () {
				sharedStub.getGenesis = sinonSandbox.stub().callsArgWith(1, 'getGenesis error');
			});

			it('should call callback with error', function () {
				inTransfer.apply(trs, dummyBlock, sender, function (err) {
					expect(err).not.to.be.empty;
				});
			});
		});

		describe('when shared.getGenesis succeeds', function () {

			beforeEach(function () {
				sharedStub.getGenesis = sinonSandbox.stub().callsArg(1);
			});

			it('should call modules.accounts.mergeAccountAndGet', function () {
				expect(accountsStub.mergeAccountAndGet.calledOnce).to.be.true;
			});

			it('should call modules.accounts.mergeAccountAndGet with address = dapp.authorId', function () {
				expect(accountsStub.mergeAccountAndGet.calledWith(sinonSandbox.match({address: validGetGensisResult.authorId}))).to.be.true;
			});

			it('should call modules.accounts.mergeAccountAndGet with balance = trs.amount', function () {
				expect(accountsStub.mergeAccountAndGet.calledWith(sinonSandbox.match({balance: trs.amount}))).to.be.true;
			});

			it('should call modules.accounts.mergeAccountAndGet with u_balance = trs.amount', function () {
				expect(accountsStub.mergeAccountAndGet.calledWith(sinonSandbox.match({u_balance: trs.amount}))).to.be.true;
			});

			it('should call modules.accounts.mergeAccountAndGet with blockId = block.id', function () {
				expect(accountsStub.mergeAccountAndGet.calledWith(sinonSandbox.match({blockId: dummyBlock.id}))).to.be.true;
			});

			it('should call modules.accounts.mergeAccountAndGet with round = slots.calcRound result', function () {
				expect(accountsStub.mergeAccountAndGet.calledWith(sinonSandbox.match({round: slots.calcRound(dummyBlock.height)}))).to.be.true;
			});
		});

		describe('when modules.accounts.mergeAccountAndGet fails', function () {

			beforeEach(function () {
				accountsStub.mergeAccountAndGet = sinonSandbox.stub().callsArgWith(1, 'mergeAccountAndGet error');
			});

			it('should call callback with error', function () {
				inTransfer.apply(trs, dummyBlock, sender, function (err) {
					expect(err).not.to.be.empty;
				});
			});
		});

		describe('when modules.accounts.mergeAccountAndGet succeeds', function () {

			it('should call callback with error = undefined', function () {
				inTransfer.apply(trs, dummyBlock, sender, function (err) {
					expect(err).to.be.undefined;
				});
			});

			it('should call callback with result = undefined', function () {
				inTransfer.apply(trs, dummyBlock, sender, function (err, res) {
					expect(res).to.be.undefined;
				});
			});
		});
	});

	describe('undo', function () {

		beforeEach(function (done) {
			inTransfer.undo(trs, dummyBlock, sender, done);
		});

		it('should call shared.getGenesis', function () {
			expect(sharedStub.getGenesis.calledOnce).to.be.true;
		});

		it('should call shared.getGenesis with {dappid: trs.asset.inTransfer.dappId}', function () {
			expect(sharedStub.getGenesis.calledWith({dappid: trs.asset.inTransfer.dappId})).to.be.true;
		});

		describe('when shared.getGenesis fails', function () {

			beforeEach(function () {
				sharedStub.getGenesis = sinonSandbox.stub().callsArgWith(1, 'getGenesis error');
			});

			it('should call callback with error', function () {
				inTransfer.undo(trs, dummyBlock, sender, function (err) {
					expect(err).not.to.be.empty;
				});
			});
		});

		describe('when shared.getGenesis succeeds', function () {

			beforeEach(function () {
				sharedStub.getGenesis = sinonSandbox.stub().callsArg(1);
			});

			it('should call modules.accounts.mergeAccountAndGet', function () {
				expect(accountsStub.mergeAccountAndGet.calledOnce).to.be.true;
			});

			it('should call modules.accounts.mergeAccountAndGet with address = dapp.authorId', function () {
				expect(accountsStub.mergeAccountAndGet.calledWith(sinonSandbox.match({address: validGetGensisResult.authorId}))).to.be.true;
			});

			it('should call modules.accounts.mergeAccountAndGet with balance = -trs.amount', function () {
				expect(accountsStub.mergeAccountAndGet.calledWith(sinonSandbox.match({balance: -trs.amount}))).to.be.true;
			});

			it('should call modules.accounts.mergeAccountAndGet with u_balance = -trs.amount', function () {
				expect(accountsStub.mergeAccountAndGet.calledWith(sinonSandbox.match({u_balance: -trs.amount}))).to.be.true;
			});

			it('should call modules.accounts.mergeAccountAndGet with blockId = block.id', function () {
				expect(accountsStub.mergeAccountAndGet.calledWith(sinonSandbox.match({blockId: dummyBlock.id}))).to.be.true;
			});

			it('should call modules.accounts.mergeAccountAndGet with round = slots.calcRound result', function () {
				expect(accountsStub.mergeAccountAndGet.calledWith(sinonSandbox.match({round: slots.calcRound(dummyBlock.height)}))).to.be.true;
			});
		});

		describe('when modules.accounts.mergeAccountAndGet fails', function () {

			beforeEach(function () {
				accountsStub.mergeAccountAndGet = sinonSandbox.stub().callsArgWith(1, 'mergeAccountAndGet error');
			});

			it('should call callback with error', function () {
				inTransfer.undo(trs, dummyBlock, sender, function (err) {
					expect(err).not.to.be.empty;
				});
			});
		});

		describe('when modules.accounts.mergeAccountAndGet succeeds', function () {

			it('should call callback with error = undefined', function () {
				inTransfer.undo(trs, dummyBlock, sender, function (err) {
					expect(err).to.be.undefined;
				});
			});

			it('should call callback with result = undefined', function () {
				inTransfer.undo(trs, dummyBlock, sender, function (err, res) {
					expect(res).to.be.undefined;
				});
			});
		});
	});

	describe('applyUnconfirmed', function () {

		it('should call callback with error = undefined', function (done) {
			inTransfer.applyUnconfirmed(trs, sender, function (err) {
				expect(err).to.be.undefined;
				done();
			});
		});

		it('should call callback with result = undefined', function (done) {
			inTransfer.applyUnconfirmed(trs, sender, function (err, result) {
				expect(result).to.be.undefined;
				done();
			});
		});
	});

	describe('undoUnconfirmed', function () {

		it('should call callback with error = undefined', function (done) {
			inTransfer.undoUnconfirmed(trs, sender, function (err) {
				expect(err).to.be.undefined;
				done();
			});
		});

		it('should call callback with result = undefined', function (done) {
			inTransfer.undoUnconfirmed(trs, sender, function (err, result) {
				expect(result).to.be.undefined;
				done();
			});
		});
	});

	describe('objectNormalize', function () {

		var library;
		var schemaSpy;

		beforeEach(function () {
			library = InTransfer.__get__('library');
			schemaSpy = sinonSandbox.spy(library.schema, 'validate');
		});

		afterEach(function () {
			schemaSpy.restore();
		});

		it('should call library.schema.validate', function () {
			inTransfer.objectNormalize(trs);
			expect(schemaSpy.calledOnce).to.be.true;
		});

		it('should call library.schema.validate with trs.asset.inTransfer', function () {
			inTransfer.objectNormalize(trs);
			expect(schemaSpy.calledWith(trs.asset.inTransfer)).to.be.true;
		});

		it('should call library.schema.validate InTransfer.prototype.schema', function () {
			inTransfer.objectNormalize(trs);
			expect(schemaSpy.args[0][1]).to.eql(InTransfer.prototype.schema);
		});

		describe('when transaction.asset.inTransfer is invalid object argument', function () {

			typesRepresentatives.nonObjects.forEach(function (nonObject) {
				it('should throw for transaction.asset.inTransfer = ' + nonObject.description, function () {
					expect(inTransfer.objectNormalize.bind(null, nonObject.input)).to.throw();
				});
			});
		});

		describe('when transaction.asset.inTransfer.dappId is invalid string argument', function () {

			typesRepresentatives.nonStrings.forEach(function (nonString) {
				it('should throw for transaction.asset.inTransfer.dappId = ' + nonString.description, function () {
					trs.asset.inTransfer.dappId = nonString.input;
					expect(inTransfer.objectNormalize.bind(null, trs)).to.throw();
				});
			});
		});

		describe('when when transaction.asset.inTransfer is valid', function () {

			it('should return transaction', function () {
				expect(inTransfer.objectNormalize(trs)).to.eql(trs);
			});
		});
	});

	describe('dbRead', function () {

		describe('when raw.in_dappId does not exist', function () {

			beforeEach(function () {
				delete rawTrs.in_dappId;
			});

			it('should return null', function () {
				expect(inTransfer.dbRead(rawTrs)).to.eql(null);
			});
		});

		describe('when raw.in_dappId exists', function () {

			it('should return result containing inTransfer', function () {
				expect(inTransfer.dbRead(rawTrs)).to.have.property('inTransfer');
			});

			it('should return result containing inTransfer.dappId = raw.dapp_id', function () {
				expect(inTransfer.dbRead(rawTrs)).to.have.nested.property('inTransfer.dappId').equal(rawTrs.in_dappId);
			});
		});
	});

	describe('afterSave', function () {

		it('should call callback with error = undefined', function () {
			inTransfer.afterSave(trs, function (err) {
				expect(err).to.be.undefined;
			});
		});

		it('should call callback with result = undefined', function () {
			inTransfer.afterSave(trs, function (err, res) {
				expect(res).to.be.undefined;
			});
		});
	});

	describe('ready', function () {

		it('should return true for single signature trs', function () {
			expect(inTransfer.ready(trs, sender)).to.equal(true);
		});

		it('should return false for multi signature transaction with less signatures', function () {
			sender.multisignatures = [validKeypair.publicKey.toString('hex')];

			expect(inTransfer.ready(trs, sender)).to.equal(false);
		});

		it('should return true for multi signature transaction with alteast min signatures', function () {
			sender.multisignatures = [validKeypair.publicKey.toString('hex')];
			sender.multimin = 1;

			delete trs.signature;
			// Not really correct signature, but we are not testing that over here
			trs.signature = crypto.randomBytes(64).toString('hex');
			trs.signatures = [crypto.randomBytes(64).toString('hex')];

			expect(inTransfer.ready(trs, sender)).to.equal(true);
		});
	});
});
