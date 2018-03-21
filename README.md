# oya-asset
OyaMist assets for crop and garden management.

### Asset
Each `Asset` instance is uniquely identified by guid. 
Assets have normal, immutable properties (i.e., 'guid' and 'tag'),
but all mutable properties are temporal (see <a href="#TValue">TValue</a>);

```JS
    var asset = new Asset();
    var feb20 = new Date(2018, 1, 20);
    var feb21 = new Date(2018, 1, 21);
    tomato.get(TValue.T_LOCATION); // undefined

    asset.set(TValue.T_LOCATION, 'SFO', feb20);
    asset.set(TValue.T_LOCATION, 'LAX', feb21);

    asset.get(TValue.T_LOCATION); // 'LAX'
    asset.get(TValue.T_LOCATION, feb20); // 'SFO'
```

A `Plant` is an `Asset`.

```JS
    var tomato = new Plant({
        plant: 'tomato',
        cultivar: 'Chocolate Stripes',
    });
    tomato.set(TValue.T_LOCATION, 'Bucket#1');
    tomato.set(Plant.T_BUDDING, true, feb20);
    tomato.get(Plant.T_BUDDING); // 2018-02-21T00:00:00Z (i.e., true is mapped to assignment date)
    tomato.set(Plant.T_BUDDING, false, feb21);
    tomato.get(Plant.T_BUDDING); // false
```

Asset snapshots provide read/write access to temporal versions:

```JS
    console.log(asset.snapShot(feb20));
    // {
    //   t: '2018-02-20T00:00:00Z',
    //   location: 'LAX',
    //   guid: ...
    //   id: ...
    //   name: ...
    //   tag: ...
    // }

    asset.updateSnapshot({
        location: 'OAK',
    }, new Date())
```

Temporal properties are ideal for auditing events since each change to a property value is recorded.
Caution should be exercised when editing temporal value history, since it can invalidate a factual record:

```JS
    asset.valueHistory(TValue.T_LOCATION); // [TValue1, TValue2, ...] 
    asset.updateValueHistory(TValue.T_LOCATION, [TValueNew1, TValueNew2, ...]);  // CAREFUL!!!
```

### TValue
A `TValue` is a <i>temporal value</i>, which has properties:

* **tag** a string such as "location" (i.e., TValue.LOCATION)
* **value** arbitrary value (default is true)
* **t** a timestamp (default is now)
* **text** optional end-user annotation

```JS
    var tvalue = new TValue({
        tag: TValue.T_LOCATION,
        value: 'SFO',
        t: new Date(2018, 1, 20),
        text: 'Departure',
    });
```

### Inventory
An `Inventory` is a collection of assets.

