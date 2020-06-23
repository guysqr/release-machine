'use strict';

const app = require('../../app.js');
const chai = require('chai');
const expect = chai.expect;
var event, context;

describe('Tests Pipeline Runner', function () {
    it('Verifies response', async () => {
        event = {
            detail: {
                requestParameters: {
                    key: 'foo',
                    bucketName: 'bar'
                }
            }
        }
        const result = await app.lambdaHandler(event, context)

        expect(result).to.be.an('object');
        expect(result).to.have.all.keys('id', 'price', 'type', 'timestamp', 'qty');
        expect(result.type).to.equal('buy');
        let qty = parseInt(result.qty);
        expect(qty).to.be.at.least(1);
        expect(qty).to.be.at.most(10);
    });
});