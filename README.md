# oya-asset
OyaMist assets for crop and garden management.

### Asset
Each `Asset` instance is uniquely identified by guid. 
Assets can have normal properties (e.g., 'guid'),
but can also have temporal properties with temporal values (i.e, `TValue`):

```JS
    var asset = new Asset();
    var feb20 = new Date(2018, 1, 20);
    var feb21 = new Date(2018, 1, 21);
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
    tomato.set(Plant.T_BUDDING, true);
```

### TValue
A `TValue` is a <i>temporal value</i>, which has properties:

* **type** a string such as "location" (i.e., TValue.LOCATION)
* **value** arbitrary value (default is true)
* **t** a timestamp (default is now)
* **text** end-user annotation

```JS
    var tvalue = new TValue({
        type: TValue.T_LOCATION,
        value: 'SFO',
        t: new Date(2018, 1, 20),
        text: 'Departure',
    });
```

### Inventory
An `Inventory` is a collection of assets.

