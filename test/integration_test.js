const path = require('path');
const grpc = require('grpc');
const should = require('should');
const async = require('async');

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 50051;
const PROTO_PATH = path.join(__dirname, '..', 'counter.proto');
const counterProto = grpc.load(PROTO_PATH);

describe('integration tests', () => {

  let client;

  before(() => {
    let credentials = grpc.credentials.createInsecure();

    client = new counterProto.counter.CounterService(
      HOST + ':' + PORT,
      credentials
    );
    
  });

  afterEach((done) => {
    client.reset({}, done);
  });
  
  it('should do nothing', () => {})

  it('should reset, then add to the counter', (done) => {

    console.log('<><><><><><><><><><>< Counter <><><><><><><><><><>');
    console.log(client);

    async.series({
      reset: function(callback) {
        client.reset({}, callback);
      },
      add: function(callback) {
        client.add({count: 1}, callback);
      },
      get: function(callback) {
        client.get({}, (err, res) => {
          should.not.exist(err);
          res.count.should.equal(1);
          callback();
        });
      }
    }, done);
  });

  it('should watch the counter', (done) => {

    console.log('<><><><><><><><><><>< Should Watch <><><><><><><><><><>');
    console.log(client);
    let stream = client.watch({});

    // want is the wanted sequence of counter.
    // the last 0 is for the afterEach reset.
    const want = [2, -1, 0];

    let i = 0;
    stream.on('data', (got) => {
      got.count.should.equal(want[i]);
      i += 1;
    });

    async.each([2, -3], function(increment, next) {
      client.add({count: increment}, next);
    }, done);
  });
  
});
