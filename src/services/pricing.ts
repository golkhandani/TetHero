import { GetLastDayCandlePricingDto } from '@dtos/pricing.dto';
import { Pricing } from '@entities/price.entity';
import { Collection } from 'mongodb';


export class PricingService {

  constructor(
    private readonly priceCollection: Collection<Pricing>,
  ) { }

  async getLastDayPricing(): Promise<Pricing[]> {
    let now = new Date();
    let requestedTime = new Date(new Date().setDate(now.getDate() - 1));
    const pipeline = [
      {
        '$match': {
          'createdAt': {
            '$gte': requestedTime
          },
          'source' :{ $ne: 'OnPay'}
        }
      }, {
        '$sort': {
          'createdAt': 1
        }
      }, {
        '$group': {
          '_id': '$source',
          'source': {
            '$first': {
              '$toUpper': '$source'
            }
          },
          'sellChart': {
            '$push': {
              'x': {
                '$dateToString': {
                  'format': '%Y-%m-%d %H:%M:%S',
                  'date': '$createdAt'
                }
              },
              'y': '$sell'
            }
          },
          'buyChart': {
            '$push': {
              'x': {
                '$dateToString': {
                  'format': '%Y-%m-%d %H:%M:%S',
                  'date': '$createdAt'
                }
              },
              'y': '$buy'
            }
          }
        }
      },
      {
        '$sort': {
          'source': -1
        }
      }
    ];
    return await this.priceCollection.aggregate(pipeline).toArray();
  }


  async getLastDayCandlePricing(query: GetLastDayCandlePricingDto): Promise<Pricing[]> {

    
    let now = new Date();
    let requestedTime = new Date(new Date().setDate(now.getDate() - 1));
    const pipeline = [
      {
        '$match': {
          'createdAt': {
            '$gte': query.from,
            '$lte': query.to
          },
          source: query.source
        }
      },
      {
        '$group': {
          '_id': {
            "year": { "$year": "$createdAt" },
            "dayOfYear": { "$dayOfYear": "$createdAt" },
            "hour": { "$hour": "$createdAt" },
            "interval": {
              "$subtract": [
                { "$minute": "$createdAt" },
                { "$mod": [{ "$minute": "$createdAt" }, query.candle] }
              ]
            }

          },
          'x': {
            '$first': {
              '$dateToString': {
                'format': '%Y-%m-%d %H:%M',
                'date': '$createdAt'
              }
            }
          },
          'max': {
            '$max': '$sell'
          },
          'min': {
            '$min': '$sell'
          },
          'open': {
            '$first': '$sell'
          },
          'close': {
            '$last': '$sell'
          }
        }
      }, {
        '$sort': {
          '_id': 1
        }
      }
    ];
    return await this.priceCollection.aggregate(pipeline).toArray();
  }

}