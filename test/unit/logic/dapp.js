'use strict';/*eslint*/

var crypto = require('crypto');
var _  = require('lodash');

var expect = require('chai').expect;
var rewire = require('rewire');
var sinon   = require('sinon');
var randomString = require('randomstring');

var node = require('./../../node.js');
var ed = require('../../../helpers/ed');
var modulesLoader = require('../../common/initModule').modulesLoader;

var Dapp = rewire('../../../logic/dapp.js');
var sql = require('../../../sql/dapps.js');

var typeRepresentatives = require('../../common/typesRepresentatives.js');

var validPassword = 'robust weapon course unknown head trial pencil latin acid';
var validKeypair = ed.makeKeypair(crypto.createHash('sha256').update(validPassword, 'utf8').digest());


var validSender = {
	password: 'yjyhgnu32jmwuii442t9',
	secondPassword: 'kub8gm2w330pvptx1or',
	username: 'mix8',
	publicKey: '5ff3c8f4be105953301e505d23a6e1920da9f72dc8dfd7babe1481b662f2b081',
	address: '4835566122337813671L',
	secondPublicKey: 'ebfb1157f9f9ad223b1c7468b0d643663ec5a34ac7a6d557243834ae604d72b7' 
};

var senderHash = crypto.createHash('sha256').update(validSender.password, 'utf8').digest();
var senderKeypair = ed.makeKeypair(senderHash);

var validTransaction = {
	id: '1907088915785679339',
	height: 371,
	blockId: '17233974955873751907',
	type: 5,
	timestamp: 40081792,
	senderPublicKey: '644485a01cb11e06a1f4ffef90a7ba251e56d54eb06a0cb2ecb5693a8cc163a2',
	senderId: '5519106118231224961L',
	recipientId: null,
	recipientPublicKey: null,
	amount: 0,
	fee: 2500000000,
	signature: 'b024f90f73e53c9fee943f3c3ef7a9e3da99bab2f9fa3cbfd5ad05ed79cdbbe21130eb7b27698692bf491a1cf573a518dfa63607dc88bc0c01925fda18304905',
	signatures: [],
	confirmations: 717,
	asset: {
		dapp: {
			name: 'AO7ezB11CgCdUZi5o8YzxCAtoRLA6Fi',
			description: null,
			tags: null,
			type: 1,
			link: 'http://www.lisk.io/AO7ezB11CgCdUZi5o8YzxCAtoRLA6Fi.zip',
			category: 2,
			icon: null
		}
	}
};

var rawValidTransaction = {
	t_id: '1907088915785679339',
	b_height: 371,
	t_blockId: '17233974955873751907',
	t_type: 5,
	t_timestamp: 40081792,
	t_senderPublicKey: '644485a01cb11e06a1f4ffef90a7ba251e56d54eb06a0cb2ecb5693a8cc163a2',
	m_recipientPublicKey: null,
	t_senderId: '5519106118231224961L',
	t_recipientId: null,
	t_amount: '0',
	t_fee: '2500000000',
	t_signature: 'b024f90f73e53c9fee943f3c3ef7a9e3da99bab2f9fa3cbfd5ad05ed79cdbbe21130eb7b27698692bf491a1cf573a518dfa63607dc88bc0c01925fda18304905',
	t_SignSignature: null,
	t_signatures: null,
	confirmations: 717,
	dapp_name: 'AO7ezB11CgCdUZi5o8YzxCAtoRLA6Fi',
	dapp_description: null,
	dapp_tags: null,
	dapp_link: 'http://www.lisk.io/AO7ezB11CgCdUZi5o8YzxCAtoRLA6Fi.zip',
	dapp_type: 1,
	dapp_category: 2,
	dapp_icon: null
};

describe('dapp', function () {

	var dapp;
	var dbStub;

	var transaction;
	var rawTransaction; 
	var sender;

	beforeEach(function () {
		dbStub = {
			query: sinon.stub()
		};
		dapp = new Dapp(dbStub, modulesLoader.scope.logger, modulesLoader.scope.schema, modulesLoader.scope.network);
	});

	afterEach(function () {
		dbStub.query.reset();
	});

	describe('with dummy data', function () {

		beforeEach(function () {
			transaction = _.cloneDeep(validTransaction);
			rawTransaction = _.cloneDeep(rawValidTransaction);
			sender = _.cloneDeep(validSender);
		});

		describe('constructor', function () {

			describe('private library object should be updated', function () {

				var library;

				beforeEach(function () {
					new Dapp(dbStub, modulesLoader.scope.logger, modulesLoader.scope.schema, modulesLoader.scope.network);
					library =Dapp.__get__('library');
				});

				it('should attach dbStub', function () {
					expect(library.db).to.eql(dbStub);
				});

				it('should attach dbStub', function () {
					expect(library.schema).to.eql(modulesLoader.scope.schema);
				});

				it('should attach logger', function () {
					expect(library.logger).to.eql(modulesLoader.scope.logger);
				});

				it('should attach logger', function () {
					expect(library.network).to.eql(modulesLoader.scope.network);
				});
			});
		});

		describe('bind', function () {

			it('should be okay with empty params', function () {
				dapp.bind();
			});
		});

		describe('calculateFee', function () {

			it('should return constants.fees.dapp', function () {
				expect(dapp.calculateFee(transaction)).to.equal(node.constants.fees.dapp);
			});
		});

		describe('verify', function () {

			describe('with invalid transaction', function () {

				describe('when receipientId exists', function () {

					it('should call callback with error = "Invalid recipient"', function (done) {
						transaction.recipientId = '4835566122337813671L';

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Invalid recipient');
							done();
						});
					});
				});

				describe('when amount is not equal to 0', function () {

					it('should call callback with error = "Invalid transaction amount"', function (done) {
						transaction.amount = 1;

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Invalid transaction amount');
							done();
						});
					});
				});

				describe('when dapp cateogry is undefined', function () {

					it('should call callback with error "Invalid application category"', function (done) {
						transaction.asset.dapp.category = undefined;

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Invalid application category');
							done();
						});
					});
				});

				describe('when dapp cateogry not found', function () {

					it('should call callback with error "Application category not found"', function (done) {
						transaction.asset.dapp.category = 9;

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Application category not found');
							done();
						});
					});
				});

				describe('when dapp icon is not link', function () {

					it('should call callback with error = "Invalid application icon link"', function (done) {
						transaction.asset.dapp.icon = 'random string';

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Invalid application icon link');
							done();
						});
					});
				});
				
				describe('when dapp icon link is invalid', function () {

					it('should call callback with error = "Invalid application icon file type"', function (done) {
						transaction.asset.dapp.icon = 'https://www.youtube.com/watch?v=de1-igivvda';

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Invalid application icon file type');
							done();
						});
					});
				});

				describe('when dapp type is invalid', function () {

					it('should call callback with error = "Invalid application type"', function (done) {
						transaction.asset.dapp.type = -1;

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Invalid application type');
							done();
						});
					});
				});

				describe('when dapp link is not in a valid url format', function () {

					it('should call callback with error = "Invalid application link"', function (done) {
						transaction.asset.dapp.link = 'random string';

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Invalid application link');
							done();
						});
					});
				});

				describe('when dapp link is invalid', function () {

					it('should call callback with error = "Invalid application file type"', function (done) {
						transaction.asset.dapp.link = 'https://www.youtube.com/watch?v=de1-igivvda';

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Invalid application file type');
							done();
						});
					});
				});

				describe('when dapp name is blank', function () {
					it('should call callback with error = "Application name must not be blank"', function (done) {
						transaction.asset.dapp.name = '  ';

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Application name must not be blank');
							done();
						});
					});
				});

				describe('when dapp name starts and ends with space', function () {

					it('should call callback with error = "Application name must not be blank"', function (done) {
						transaction.asset.dapp.name = ' randomname ';

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Application name must not be blank');
							done();
						});
					});
				});

				describe('when dapp name is longer than 32 characters', function () {

					it('should call callback with error = "Application name is too long. Maximum is 32 characters"', function (done) {
						transaction.asset.dapp.name = Array.apply(null, Array(33)).map(function () { return 'a';}).join('');

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Application name is too long. Maximum is 32 characters');
							done();
						});
					});
				});

				describe('when dapp description is longer than 160 characters', function () {

					it('should call callback with error = "Application description is too long. Maximum is 160 characters"', function (done) {
						transaction.asset.dapp.description = Array.apply(null, Array(161)).map(function () { return 'a';}).join('');

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Application description is too long. Maximum is 160 characters');
							done();
						});
					});
				});

				describe('when dapp tags are longer than 160 characters', function () {

					it('should call callback with error = "Application tags is too long. Maximum is 160 characters"', function (done) {
						transaction.asset.dapp.tags = Array.apply(null, Array(161)).map(function () { return 'a';}).join('');

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Application tags is too long. Maximum is 160 characters');
							done();
						});
					});
				});

				describe('when dapp tags duplicate', function () {

					it('should call callback with error = "Encountered duplicate tag: a in application"', function (done) {
						transaction.asset.dapp.tags = Array.apply(null, Array(3)).map(function () { return 'a';}).join(',');

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Encountered duplicate tag: a in application');
							done();
						});
					});
				});

				describe('when dbStub rejects proimse', function () {

					var dbError = new Error(); 

					it('should call callback with error = "DApp#verify error"', function (done) {
						dbStub.query.withArgs(sql.getExisting, {
							name: transaction.asset.dapp.name,
							link: transaction.asset.dapp.link || null,
							transactionId: transaction.id
						}).rejects(dbError);

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('DApp#verify error');
							done();
						});
					});
				});

				describe('when dbStub resolves with application', function () {

					var dappParams;

					beforeEach(function () {
						dappParams = {
							name: transaction.asset.dapp.name,
							link: transaction.asset.dapp.link || null,
							transactionId: transaction.id
						};
					});

					// TODO: Some of the code these tests are testing is redundant. We should review and refactor it.
					it('should call callback with error', function (done) {
						dbStub.query.withArgs(sql.getExisting, dappParams).resolves([{
							name: transaction.asset.dapp.name
						}]);

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Application name already exists: ' + transaction.asset.dapp.name);
							done();
						});
					});

					it('should call callback with error if application link already exists', function (done) {

						dbStub.query.withArgs(sql.getExisting, dappParams).resolves([{
							link: transaction.asset.dapp.link
						}]);

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Application link already exists: ' + transaction.asset.dapp.link);
							done();
						});
					});

					it('should call callback with error if application already exists', function (done) {
						dbStub.query.withArgs(sql.getExisting, {
							name: transaction.asset.dapp.name,
							link: transaction.asset.dapp.link || null,
							transactionId: transaction.id
						}).resolves([{tags: 'a,b,c'}]);

						dapp.verify(transaction, sender, function (err) {
							expect(err).to.equal('Application already exists');
							done();
						});
					});
				});
			});

			describe('when transaction is valid', function (done) {

				beforeEach(function () {
					dbStub.query.withArgs(sql.getExisting, {
						name: transaction.asset.dapp.name,
						link: transaction.asset.dapp.link || null,
						transactionId: transaction.id
					}).resolves([]);
				});

				it('should call callback with error = null and transaction for valid transaction type', function (done) {
					transaction.asset.dapp.type = 2;

					dapp.verify(transaction, sender, function (err) {
						expect(err).to.equal('Invalid application type');
						done();
					});
				});

				it('should call dbStub.query with correct params', function (done) {
					dapp.verify(transaction, sender, function (err, res) {
						expect(dbStub.query.calledOnce).to.equal(true);
						expect(dbStub.query.calledWithExactly(sql.getExisting, {
							name: transaction.asset.dapp.name,
							link: transaction.asset.dapp.link || null,
							transactionId: transaction.id
						})).to.equal(true);
						done();
					});
				});

				it('should call callback with error = null and transaction', function (done) {
					dapp.verify(transaction, sender, function (err, res) {
						expect(err).to.not.exist;
						expect(res).to.eql(transaction);
						done();
					});
				});
			});
		});

		describe('process', function () {

			it('should call the callback', function (done) {
				dapp.process(transaction, sender, done);
			});
		});

		describe('getBytes', function () {

			it('should get bytes of valid transaction', function () {
				expect(dapp.getBytes(transaction).toString('hex')).to.equal('414f37657a42313143674364555a69356f38597a784341746f524c41364669687474703a2f2f7777772e6c69736b2e696f2f414f37657a42313143674364555a69356f38597a784341746f524c413646692e7a69700100000002000000');
			});

			it('should get bytes of valid transaction', function () {
				expect(dapp.getBytes(transaction).length).to.equal(93);
			});
		});

		describe('apply', function () {

			var dummyBlock = {
				id: '9314232245035524467',
				height: 1
			};

			var unconfirmedNames;
			var unconfirmedLinks;

			beforeEach(function () {
				unconfirmedNames = Dapp.__get__('__private.unconfirmedNames');
				unconfirmedLinks = Dapp.__get__('__private.unconfirmedLinks');
			});

			it('should update private unconfirmed name variable', function (done) {
				dapp.apply(transaction, dummyBlock, sender, function (err, cb) {
					expect(unconfirmedNames[transaction.asset.dapp.name]).to.not.exist;
					done();
				});
			});

			it('should update private unconfirmed links variable', function (done) {
				dapp.apply(transaction, dummyBlock, sender, function (err, cb) {
					expect(unconfirmedLinks[transaction.asset.dapp.link]).to.not.exist;
					done();
				});
			});
		});

		describe('undo', function () {

			var dummyBlock = {
				id: '9314232245035524467',
				height: 1
			};

			it('should call the callback function', function (done) {
				dapp.undo(transaction, dummyBlock, sender, function () {
					done();
				});
			});
		});

		describe('applyUnconfirmed', function () {

			describe('when unconfirmed names already exists', function () {

				beforeEach(function () {
					var dappNames = {};
					dappNames[transaction.asset.dapp.name] = true;
					Dapp.__set__('__private.unconfirmedNames', dappNames);
					Dapp.__set__('__private.unconfirmedLinks', {});
				});

				it('should call callback with error', function (done) {
					dapp.applyUnconfirmed(transaction, sender, function (err)  {
						expect(err).to.equal('Application name already exists');
						done();
					});
				});
			});

			describe('when unconfirmed link already exists', function () {

				beforeEach(function () {
					var dappLinks = {};
					dappLinks[transaction.asset.dapp.link] = true;
					Dapp.__set__('__private.unconfirmedLinks', dappLinks);
					Dapp.__set__('__private.unconfirmedNames', {});
				});

				it('should call callback with error', function (done) {
					dapp.applyUnconfirmed(transaction, sender, function (err)  {
						expect(err).to.equal('Application link already exists');
						done();
					});
				});
			});

			describe('when unconfirmed dapp does not exist', function () {

				var unconfirmedNames;
				var unconfirmedLinks;

				beforeEach(function () {
					var dappNames = {};
					var dappLinks = {};
					Dapp.__set__('__private.unconfirmedLinks', dappLinks);
					Dapp.__set__('__private.unconfirmedNames', dappNames);
					unconfirmedNames = Dapp.__get__('__private.unconfirmedNames');
					unconfirmedLinks = Dapp.__get__('__private.unconfirmedLinks');
				});

				it('should update unconfirmed name private variable', function (done) {
					dapp.applyUnconfirmed(transaction, sender, function () {
						expect(unconfirmedNames[transaction.asset.dapp.name]).to.equal(true);
						done();
					});
				});

				it('should update unconfirmed link private variable', function (done) {
					dapp.applyUnconfirmed(transaction, sender, function () {
						expect(unconfirmedLinks[transaction.asset.dapp.link]).to.equal(true);
						done();
					});
				});

				it('should call callback with error = undefined', function (done) {
					dapp.applyUnconfirmed(transaction, sender, function () {
						done();
					});
				});
			});
		});

		describe('undoUnconfirmed', function () {

			var unconfirmedNames;
			var unconfirmedLinks;

			beforeEach(function () {
				var dappNames = {};
				var dappLinks = {};
				Dapp.__set__('__private.unconfirmedLinks', dappLinks);
				Dapp.__set__('__private.unconfirmedNames', dappNames);
				unconfirmedNames = Dapp.__get__('__private.unconfirmedNames');
				unconfirmedLinks = Dapp.__get__('__private.unconfirmedLinks');
			});

			it('should delete unconfirmed name private variable', function (done) {
				dapp.undoUnconfirmed(transaction, sender, function () {
					expect(unconfirmedNames[transaction.asset.dapp.name]).not.exist;
					done();
				});
			});

			it('should delete unconfirmed link private variable', function (done) {
				dapp.undoUnconfirmed(transaction, sender, function () {
					expect(unconfirmedLinks[transaction.asset.dapp.link]).not.exist;
					done();
				});
			});

			it('should call callback with error = undefined', function (done) {
				dapp.undoUnconfirmed(transaction, sender, function () {
					done();
				});
			});
		});

		describe('objectNormalize', function () {

			describe('using undefined properties in the dapp asset', function () {

				var invalidProperties = {
					dummyUndefinedProperty: undefined,
					dummpyNullProperty: null
				};

				beforeEach(function () {
					transaction.asset.dapp = _.assign(transaction.asset.dapp, invalidProperties);
				});

				it('should remove undefined properties', function () {
					transaction = dapp.objectNormalize(transaction);
					expect(transaction).to.not.have.property('dummyUndefinedProperty');
				});

				it('should remove null properties', function () {
					transaction = dapp.objectNormalize(transaction);
					expect(transaction).to.not.have.property('dummpyNullProperty');
				});
			});

			describe('schema properties', function () {

				var library;
				var schemaSpy;

				beforeEach(function () {
					library = Dapp.__get__('library');
					schemaSpy = sinon.spy(library.schema, 'validate');
				});

				afterEach(function () {
					schemaSpy.restore();
				});

				it('should use the correct format to validate against', function () {
					dapp.objectNormalize(transaction);
					expect(schemaSpy.calledOnce).to.equal(true);
					expect(schemaSpy.calledWithExactly(transaction.asset.dapp, Dapp.prototype.schema)).to.equal(true);
				});
			});

			describe('dynamic schema tests', function () {

				describe('category', function () {

					var invalidTypes = _.difference(typeRepresentatives.allTypes, 
						typeRepresentatives.positiveIntegers,
						typeRepresentatives.negativeIntegers,
						typeRepresentatives.others
					);

					var otherTypes = typeRepresentatives.others;

					var invalidCategoriesNumber = [-1, -2, 0.1, 9, 10];
					var validCategories = [0, 1, 2, 3, 4, 5, 6, 7, 8];

					invalidTypes.forEach(function (type) {

						it('should throw error for: ' + type.description, function () {
							transaction.asset.dapp.category = type.input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw('Failed to validate dapp schema: Expected type integer but found type ' + type.expectation);
						});
					});

					otherTypes.forEach(function (type) {
						it('should throw error for: ' + type.description, function () {
							transaction.asset.dapp.category = type.input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw();
						});
					});

					invalidCategoriesNumber.forEach(function (input) {

						it('should throw error for value: ' + input, function () {
							transaction.asset.dapp.category = input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw();
						});
					});

					validCategories.forEach(function (input) {

						it('should not throw error for valid value: ' + input, function () {
							transaction.asset.dapp.category = input;
							dapp.objectNormalize(transaction);
						});
					});
				});

				describe('name', function () {

					var invalidTypes = _.difference(typeRepresentatives.allTypes, 
						typeRepresentatives.strings,
						typeRepresentatives.others
					);

					var otherTypes = typeRepresentatives.others;

					var invalidNames = ['', _.fill(new Array(33), 'a'), _.fill(new Array(34), 'b')];
					var validNames = _.fill(new Array(5), 'a').map(function () {
						return node.randomApplicationName();
					});

					invalidTypes.forEach(function (type) {

						it('should throw error for: ' + type.description, function () {
							transaction.asset.dapp.name = type.input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw('Failed to validate dapp schema: Expected type string but found type ' + type.expectation);
						});
					});

					otherTypes.forEach(function (type) {
						it('should throw error for: ' + type.description, function () {
							transaction.asset.dapp.name = type.input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw();
						});
					});

					invalidNames.forEach(function (input) {

						it('should throw error for value: ' + input, function () {
							transaction.asset.dapp.name = input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw();
						});
					});

					validNames.forEach(function (input) {

						it('should not throw error for value: ' + input, function () {
							transaction.asset.dapp.name = input;
							expect(dapp.objectNormalize.bind(null, transaction)).not.throw();
						});
					});
				});

				describe('description', function () {

					var invalidTypes = _.difference(typeRepresentatives.allTypes, 
						typeRepresentatives.strings,
						typeRepresentatives.others
					);

					var invalidDescriptions = [_.fill(new Array(161), 'a'), _.fill(new Array(162), 'b')];
					var validDescriptions = _.fill(new Array(33), 'a').map(function () {
						return randomString.generate(Math.random() * 160);
					});

					invalidTypes.forEach(function (type) {

						it('should throw error for: ' + type.description, function () {
							transaction.asset.dapp.description = type.input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw('Failed to validate dapp schema: Expected type string but found type ' + type.expectation);
						});
					});

					invalidDescriptions.forEach(function (input) {

						it('should throw error for value: ' + input, function () {
							transaction.asset.dapp.description = input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw();
						});
					});

					validDescriptions.forEach(function (input) {

						it('should not throw error for value: ' + input, function () {
							transaction.asset.dapp.description = input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.not.throw();
						});
					});
				});

				describe('tags', function () {

					var invalidTypes = _.difference(typeRepresentatives.allTypes, 
						typeRepresentatives.strings,
						typeRepresentatives.others
					);

					var invalidTags = [_.fill(new Array(161), 'a'), _.fill(new Array(81), 'b').join(',')];

					var validTags = [_.fill(new Array(_.toInteger(Math.random() * 80)), randomString.generate(1)).join(','), 'adventure, fantasy'];

					invalidTypes.forEach(function (type) {

						it('should throw error for: ' + type.description, function () {
							transaction.asset.dapp.tags = type.input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw('Failed to validate dapp schema: Expected type string but found type ' + type.expectation);
						});
					});

					invalidTags.forEach(function (input) {

						it('should throw error for value: ' + input, function () {
							transaction.asset.dapp.tags = input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw();
						});
					});

					validTags.forEach(function (input) {

						it('should not throw error for value: ' + input, function () {
							transaction.asset.dapp.tags = input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.not.throw();
						});
					});
				});

				describe('type', function () {

					var invalidTypes = _.difference(typeRepresentatives.allTypes, 
						typeRepresentatives.positiveIntegers,
						typeRepresentatives.negativeIntegers,
						typeRepresentatives.others
					);

					var otherTypes = typeRepresentatives.others;

					var invalidTypesValues = [-0, -1, -2].concat(typeRepresentatives.negativeIntegers);

					// No max limit set on type. Type verification is partially handled here 
					// and the rest is handled in verify function. 
					// TODO: Do stronger schema checks
					var validTypes = [1, 2, 4, 11].concat(_.map(typeRepresentatives.positiveIntegers, 'input'));
					invalidTypes.forEach(function (type) {

						it('should throw error for: ' + type.description, function () {
							transaction.asset.dapp.type = type.input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw('Failed to validate dapp schema: Expected type integer but found type ' + type.expectation);
						});
					});

					otherTypes.forEach(function (type) {
						it('should throw error for: ' + type.description, function () {
							transaction.asset.dapp.type = type.input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw();
						});
					});

					invalidTypes.forEach(function (input) {

						it('should throw error for value: ' + input, function () {
							transaction.asset.dapp.type = input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw();
						});
					});

					validTypes.forEach(function (input) {

						it('should not throw error for value: ' + input, function () {
							transaction.asset.dapp.type = input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.not.throw();
						});
					});
				});

				describe('link', function () {

					var invalidTypes = _.difference(typeRepresentatives.allTypes, 
						typeRepresentatives.strings,
						typeRepresentatives.others
					);

					// TODO: Schema checks only check whether property is a string or not, 
					// and not whether value is actually a link. We need to handle it here.
					var invalidLinks = [_.fill(new Array(2002), 'a'), _.fill(new Array(2001), 'a')];
					var validLinks = _.fill(new Array(5), '').map(function () {
						return node.randomApplicationName();
					});

					invalidTypes.forEach(function (type) {

						it('should throw error for: ' + type.description, function () {
							transaction.asset.dapp.link = type.input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw('Failed to validate dapp schema: Expected type string but found type ' + type.expectation);
						});
					});

					invalidLinks.forEach(function (input) {

						it('should throw error for value: ' + input, function () {
							transaction.asset.dapp.link = input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw();
						});
					});

					validLinks.forEach(function (input) {

						it('should not throw error for value: ' + input, function () {
							transaction.asset.dapp.link = input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.not.throw();
						});
					});
				});

				describe('icon', function () {

					var invalidTypes = _.difference(typeRepresentatives.allTypes, 
						typeRepresentatives.strings,
						typeRepresentatives.others
					);

					// TODO: Schema checks only check whether property is a string or not, 
					// and not whether value is actually a link. We need to handle it here.
					var invalidIcons = [_.fill(new Array(2002), 'a'), _.fill(new Array(2001), 'a')];
					var validIcons = _.fill(new Array(5), '').map(function () {
						return node.randomApplicationName();
					});

					invalidTypes.forEach(function (type) {

						it('should throw error for: ' + type.description, function () {
							transaction.asset.dapp.icon = type.input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw('Failed to validate dapp schema: Expected type string but found type ' + type.expectation);
						});
					});

					invalidIcons.forEach(function (input) {

						it('should throw error for value: ' + input, function () {
							transaction.asset.dapp.icon = input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.throw();
						});
					});

					validIcons.forEach(function (input) {

						it('should not throw error for value: ' + input, function () {
							transaction.asset.dapp.icon = input;
							expect(dapp.objectNormalize.bind(null, transaction)).to.not.throw();
						});
					});
				});
			});

			it('should return transaction when asset is valid', function () {
				expect(dapp.objectNormalize(transaction)).to.eql(transaction);
			});
		});

		describe('dbRead', function () {

			describe('when rawTransaction.dapp_name does not exist', function () {

				beforeEach(function () {
					delete rawTransaction.dapp_name;
				});

				it('should return null', function () {
					expect(dapp.dbRead(rawTransaction)).to.eql(null);
				});
			});

			describe('when rawTransaction.dapp_name exists', function () {

				it('should return result containing dapp property', function () {
					expect(dapp.dbRead(rawTransaction)).to.have.property('dapp');
				});

				it('should return result containing dapp property', function () {
					expect(dapp.dbRead(rawTransaction)).to.have.nested.property('dapp.category').to.equal(rawTransaction.dapp_category);
				});

				it('should return result containing dapp property', function () {
					expect(dapp.dbRead(rawTransaction)).to.have.nested.property('dapp.description').to.eql(rawTransaction.dapp_description);
				});

				it('should return result containing dapp property', function () {
					expect(dapp.dbRead(rawTransaction)).to.have.nested.property('dapp.icon').to.eql(rawTransaction.dapp_icon);
				});

				it('should return result containing dapp property', function () {
					expect(dapp.dbRead(rawTransaction)).to.have.nested.property('dapp.link').to.eql(rawTransaction.dapp_link);
				});

				it('should return result containing dapp property', function () {
					expect(dapp.dbRead(rawTransaction)).to.have.nested.property('dapp.name').to.eql(rawTransaction.dapp_name);
				});

				it('should return result containing dapp property', function () {
					expect(dapp.dbRead(rawTransaction)).to.have.nested.property('dapp.tags').to.eql(rawTransaction.dapp_tags);
				});

				it('should return result containing dapp property', function () {
					expect(dapp.dbRead(rawTransaction)).to.have.nested.property('dapp.type').to.eql(rawTransaction.dapp_type);
				});
			});
		});

		describe('dbSave', function () {

			var dbSaveResult;

			beforeEach(function () {
				dbSaveResult = dapp.dbSave(transaction);
			});

			it('should return result containing table = "dapps"', function () {
				expect(dbSaveResult).to.have.property('table').equal('dapps');
			});
			it('should return result containing fields = ["type", "name", "description", "tags", "link", "category", "icon", "transactionId"]', function () {
				expect(dbSaveResult).to.have.property('fields').eql(['type', 'name', 'description', 'tags', 'link', 'category', 'icon', 'transactionId']);
			});

			it('should return result containing values', function () {
				expect(dbSaveResult).to.have.property('values');
			});

			it('should return result containing values.type = transaction.asset.dapp.type', function () {
				expect(dbSaveResult).to.have.nested.property('values.type').equal(transaction.asset.dapp.type);
			});

			it('should return result containing values.name = transaction.asset.dapp.name', function () {
				expect(dbSaveResult).to.have.nested.property('values.name').equal(transaction.asset.dapp.name);
			});

			it('should return result containing values.description = transaction.asset.dapp.description', function () {
				expect(dbSaveResult).to.have.nested.property('values.description').equal(transaction.asset.dapp.description);
			});

			it('should return result containing values.tags = transaction.asset.dapp.tags', function () {
				expect(dbSaveResult).to.have.nested.property('values.tags').equal(transaction.asset.dapp.tags);
			});

			it('should return result containing values.icon = transaction.asset.dapp.icon', function () {
				expect(dbSaveResult).to.have.nested.property('values.icon').equal(transaction.asset.dapp.icon);
			});

			it('should return result containing values.category = transaction.asset.dapp.category', function () {
				expect(dbSaveResult).to.have.nested.property('values.category').equal(transaction.asset.dapp.category);
			});

			it('should return result containing values.transactionId = trs.id', function () {
				expect(dbSaveResult).to.have.nested.property('values.transactionId').equal(transaction.id);
			});
		});

		describe('ready', function () {

			it('should return true for single signature transaction', function () {
				expect(dapp.ready(transaction, sender)).to.equal(true);
			});

			it('should return false for multi signature transaction with less signatures', function () {
				sender.multisignatures = [validKeypair.publicKey.toString('hex')];

				expect(dapp.ready(transaction, sender)).to.equal(false);
			});

			it('should return true for multi signature transaction with alteast min signatures', function () {
				sender.multisignatures = [validKeypair.publicKey.toString('hex')];
				sender.multimin = 1;

				delete transaction.signature;
				// Not really correct signature, but we are not testing that over here
				transaction.signature = crypto.randomBytes(64).toString('hex');;
				transaction.signatures = [crypto.randomBytes(64).toString('hex')];

				expect(dapp.ready(transaction, sender)).to.equal(true);
			});
		});
	});
});
