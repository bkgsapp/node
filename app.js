const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mysql_aw = require('mysql2/promise');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
var async = require('async');
const bluebird = require('bluebird');
const app = express();
app.use(cors());
app.use(bodyParser.json());
const constants = require('./src/constants/constants');
const fs =  require('fs');
const https = require('https')

  var mysql_con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Bangalore@1",
    database: "bkgs"
  });


  var bkgs_con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Bangalore@1",
    database: "bkgs"
  });

  // var mysql_con = mysql.createConnection({
  //   host: "localhost",
  //   user: "root",
  //   password: "KiraneWala@369",
  //   database: "bkgs"
  // });


  // var bkgs_con = mysql.createConnection({
  //   host: "localhost",
  //   user: "root",
  //   password: "KiraneWala@369",
  //   database: "bkgs"
  // });

  // var mysql_con = mysql.createConnection({
  //   host: "localhost",
  //   user: "insidemy_farm2b6",
  //   password: "InsMyFarm777",
  //   database: "insidemy_farm2b6m_primary_database"
  // });

  var mysql_await
  (async function() {
    mysql_await = await mysql_aw.createConnection({host:'localhost', user: 'root',password: "Bangalore@1", database: 'bkgs',Promise: bluebird})
 })();

  mysql_con.connect(function(err) {
    if (err) throw err;
    console.log('connectd');  
  })



app.post('/sign_in', function (req, res) {
   const { usr_email, usr_password } = req.body;
    mysql_con.query("SELECT `customer_id`,`email_id`,`password` FROM `user_info` WHERE `email_id` = '"+usr_email+"'", (err, result, fields) => {
      if(err){
        res.send('failed')
      }
      var email = result[0]['email_id'];
      var password = result[0]['password'];
      var customer_id = result[0]['customer_id'];
      //var server_pass;
      
      // bcrypt.hash('1234567',10,(err, hash) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   server_pass = hash
      //   //console.log(hash);     
      // });

      const token = jwt.sign({ customer_id: customer_id }, 'MY_SECRET_KEY');
      res.send({'token':token});
      return; 
      
      bcrypt.compare(usr_password, password, (err, isMatch) => {
        if (err) {
          console.log(err);
          res.status(422).send({ error: 'Unknown Error' });
        }
        if (!isMatch) {
          console.log('!isMatch');
          res.status(422).send({ error: 'Must provide valid email and password' });
          return;     
        }
         const token = jwt.sign({ customer_id: customer_id }, 'MY_SECRET_KEY');
         res.send({'token':token});
         return;      
      });


    });  
})

app.post('/getfarms', async function (req, res) {
  const { usr_email } = req.body;
  var resultArr = Array();
  var result = Array();

  try{
  var [result,fields] = await mysql_await.execute("SELECT DISTINCT `farm_name`,`location`,`farm_type` FROM `customer` WHERE `email_id` = '"+usr_email+"'");
  console.log(result.length);
  console.log(result);
  var x;
  var i=0;
  for(x of result)
  {
      var plantName = '';
      var farmName = ''
      resultArr[i] = Array();
      resultArr[i].push(x.farm_name);
      resultArr[i].push(x.location);
      resultArr[i].push(x.farm_type);

      var[DeviceIdRes,fields] = await mysql_await.execute("SELECT DISTINCT `device_id` FROM `customer` WHERE `email_id`='"+usr_email+"' and `farm_name`= '"+x.farm_name+"'");
      //console.log(DeviceIdRes);
      var y;
      var j = 0;
      var DeviceId = '';
      for(y of DeviceIdRes)
      {
        //console.log(y.device_id);
        //DeviceId += y.device_id;
            if(j==0)
            DeviceId += y.device_id;
            else
            DeviceId += ","+y.device_id;
            j++;
      }
      resultArr[i].push(DeviceId);
      console.log(x.plant_id);
      var[PlantsRes,fields] = await mysql_await.execute("SELECT DISTINCT `plant_name` FROM `customer` WHERE `email_id`='"+usr_email+"' and `farm_name`= '"+x.farm_name+"'");
      //console.log(PlantsRes);
      var y;
      var j = 0;
      var plantNames = '';
      for(y of PlantsRes)
      {
        //console.log(y.device_id);
        //DeviceId += y.device_id;
            if(j==0)
            plantNames += y.plant_name;
            else
            plantNames += ","+y.plant_name;
            j++;
      }
      resultArr[i].push(plantNames);

      i++;
  }
  console.log(resultArr);
  res.send(resultArr)
}
catch(e){
  res.send(e)
}
})

app.post('/getDevicePosting',async function (req, res) {
  const {usr_email} = req.body;
  try{
    var resultArr = Array();
  var [farmRes,Fileds] = await mysql_await.execute("SELECT `device_id`,`plant_name`, `farm_name`, `farm_type` FROM `customer` WHERE `email_id` = '"+usr_email+"'");
  var i = 0;
  for(x of farmRes)
  {
      var [SensorDatas,Fileds] = await mysql_await.execute("SELECT `temperature`, `humidity`, `co2`, `soil_moisture`, `soil_ph`, `par`, `soil_temperature` FROM `sensor_data`WHERE `sensor_id` = '"+x.device_id+"' ORDER BY `date_time` DESC LIMIT 1");
      
      if(SensorDatas.length>=1)
      {
      resultArr[i] = Array();
      resultArr[i].push(x.farm_name);
      resultArr[i].push(x.device_id);
      resultArr[i].push(x.plant_name);
      resultArr[i].push(x.farm_type); 
      resultArr[i].push(SensorDatas[0].temperature);
      resultArr[i].push(SensorDatas[0].humidity);
      resultArr[i].push(SensorDatas[0].co2);
      resultArr[i].push(SensorDatas[0].soil_moisture);
      resultArr[i].push(SensorDatas[0].soil_ph);
      resultArr[i].push(SensorDatas[0].par);
      resultArr[i].push(SensorDatas[0].soil_temperature);
      i++;
      }
    
      //console.log(resultArr);
  }
  //console.log(resultArr);
  res.send(resultArr)

}
  catch(e){
    res.send(e)
  }
})

app.post('/get_devices',function (req, res) {
      const { usr_email , farm_name} = req.body;
      mysql_con.query("SELECT DISTINCT `device_id` FROM `customer` WHERE `email_id` = '"+usr_email+"'AND `farm_name`= '"+farm_name+"'", (err, result, fields) => {
        if(err){
          res.send('failed')
        }
        console.log("SELECT DISTINCT `device_id` FROM `customer` WHERE `email_id` = '"+usr_email+"'AND `farm_name`= '"+farm_name+"'");
        res.send(result)
      });
  }
);


app.post('/get_plants',function (req, res) {
  const { usr_email , farm_name} = req.body;
  mysql_con.query("SELECT `plant_name` FROM `customer` WHERE `email_id` = '"+usr_email+"'AND `farm_name`= '"+farm_name+"'", (err, result, fields) => {
    if (err) throw err;
    console.log(result);
    res.send(result)
  });
});

app.post('/add_farm',function (req, res) {
  const { usr_email , farm_name ,plant_name,dev_id,farm_type} = req.body;
  var customer_id,country;
  var values=[];

  mysql_con.query("SELECT `customer_id`,`country` FROM `user_info` WHERE `email_id` = '"+usr_email+"'", (err, result, fields) => {
    if (err){
      res.send('failed')
    }
    //console.log(result[0][`customer_id`]);
    customer_id = result[0]['customer_id'];
    country = result[0]['country'];
    values = [customer_id,usr_email,dev_id,country,plant_name,farm_name,farm_type]
    mysql_con.query("INSERT INTO `customer`(`customer_id`,`email_id`,`device_id`,`location`,`plant_name`,`farm_name`,`farm_type`) VALUES (?)",[values], (err, result, fields) => {
      if(err){
        res.send('failed')
      }
      res.send(result)
    });
  });

 
});

app.post('/add_plant',function (req, res) {
  const {usr_email , farm_name ,plant_name,dev_id,farm_type} = req.body;
  var customer_id,country;
  var values=[];

  mysql_con.query("SELECT `customer_id`,`country` FROM `user_info` WHERE `email_id` = '"+usr_email+"'", (err, result, fields) => {
    if(err){
      res.send('failed')
    }
    //console.log(result[0][`customer_id`]);
    customer_id = result[0]['customer_id'];
    country = result[0]['country'];
    values = [customer_id,usr_email,dev_id,country,plant_name,farm_name,farm_type]
    mysql_con.query("INSERT INTO `customer`(`customer_id`,`email_id`,`device_id`,`location`,`plant_name`,`farm_name`,`farm_type`) VALUES (?)",[values], (err, result, fields) => {
      if(err){
        res.send('failed')
      }
      res.send(result)
    });
  });
});

app.post('/add_device',function (req, res) {
  const {usr_email , farm_name ,plant_name,dev_id,farm_type} = req.body;
  var customer_id,country;
  var values=[];

  mysql_con.query("SELECT `customer_id`,`country` FROM `user_info` WHERE `email_id` = '"+usr_email+"'", (err, result, fields) => {
    if(err){
      res.send('failed')
    }
    //console.log(result[0][`customer_id`]);
    customer_id = result[0]['customer_id'];
    country = result[0]['country'];
    values = [customer_id,usr_email,dev_id,country,plant_name,farm_name,farm_type]
    mysql_con.query("INSERT INTO `customer`(`customer_id`,`email_id`,`device_id`,`location`,`plant_name`,`farm_name`,`farm_type`) VALUES (?)",[values], (err, result, fields) => {
      if(err){
        res.send('failed')
      }
      res.send(result)
    });
  });
});

app.post('/deviceDet',function (req, res) {
  bkgs_con.query('SELECT * FROM `sensor_data` WHERE `sensor_id` = "BKGS001" ORDER BY `date_time` DESC',(err, result, fields) => {
    if(err){
      res.send('failed')
    }
    res.send(result)
  });
  })

app.post('/getPlants',async function(req,res){
  const{usrMailId} = req.body;
  try{
  var [farmRes,Fileds] = await mysql_await.execute("SELECT Distinct `plant_name` FROM `plants` WHERE 1");
  res.send(farmRes);
  }
  catch(e){
    console.log(e);
  }
 })

 app.post('/pairDevice',async function(req,res){
  const{usr_email,dev_id,farmName,farmType,plantName} = req.body;
  try{
    var [customerDetails,Fileds] = await mysql_await.execute("SELECT `customer_id` FROM `user_info` WHERE `email_id` = '"+usr_email+"'");
    var cusId = customerDetails[0][`customer_id`];
    var [InsertQuery,Fileds] = await mysql_await.execute("INSERT INTO `customer`(`customer_id`, `email_id`, `device_id`, `plant_name`, `farm_name`, `farm_type`) VALUES ('"+cusId+"','"+usr_email+"','"+dev_id+"','"+plantName+"','"+farmName+"','"+farmType+"')");
    console.log(InsertQuery);
    res.send(InsertQuery);
    }
    catch(e){
      console.log(e);
    res.send('error');

    }
 })

 app.post('/getDevices',async function(req,res){
  const{usr_email,farmName} = req.body;
  try{
    var [deviceIds,Fileds] = await mysql_await.execute("SELECT `device_id` FROM `customer` WHERE `email_id`='"+usr_email+"' AND `farm_name`='"+farmName+"'");
    res.send(deviceIds);
  }
  catch(e){
    console.log(e);
    res.send('error');
  }

 })

 app.post('/unpairdev',async function(req,res){
  const{usr_email,farmName,devid} = req.body;
  try{
    //console.log("DELETE FROM `customer` WHERE `email_id`='"+usr_email+"' AND `device_id` = '"+devid+"' AND `farm_name` = '"+farmName+"'");
    var [deviceIds,Fileds] = await mysql_await.execute("DELETE FROM `customer` WHERE `email_id`='"+usr_email+"' AND `device_id` = '"+devid+"' AND `farm_name` = '"+farmName+"'");
    res.send(deviceIds);
  }
  catch(e){
    console.log(e);
    res.send('error');
  }
 })

 app.post('/updateRate',async function(req,res){
  const{devid,time} = req.body;
  try{
    var [result,Fileds] = await mysql_await.execute("UPDATE `device_details` SET `update_frequency_mins` = '"+time+"'WHERE `sensor_id` = '"+devid+"'");
    res.send(result);
  }
  catch(e){
    console.log(e);
    res.send('error');
  }
})

app.post('/getZoneStat',async function(req,res){
  const{devid} = req.body;
  try{
    var [result,Fileds] = await mysql_await.execute("SELECT `zone_1_st`, `zone_1_rt`, `zone_2_st`, `zone_2_rt`, `zone_3_st`, `zone_3_rt`, `zone_4_st`, `zone_4_rt`, `zone_5_st`, `zone_5_rt`, `zone_6_st`, `zone_6_rt`, `zone_7_st`, `zone_7_rt`, `zone_8_st`, `zone_8_rt`, `zone_9_st`, `zone_9_rt`, `zone_10_st`, `zone_10_rt`, `zone_11_st`, `zone_11_rt`, `zone_12_st`, `zone_12_rt` FROM `irrigation_cntrl` WHERE `id`='"+devid+"'");
    res.send(result);
  }
  catch(e){
    console.log(e);
    res.send('error');
  }
})

app.post('/getZoneData',async function(req,res){
  //console.log(req.body);
  const{zoneNo} = req.body;
  const startDate = "Z"+zoneNo+"_start_date";
  const startTime = "Z"+zoneNo+"_start_time";
  const RunTime = "Z"+zoneNo+"_run_time";
  try{
    var [ZoneNames,Fileds] = await mysql_await.execute("SELECT `Zone_1_NM`,`Zone_2_NM`,`Zone_3_NM`,`Zone_4_NM`,`Zone_5_NM`,`Zone_6_NM`,`Zone_7_NM`,`Zone_8_NM`,`Zone_9_NM`,`Zone_10_NM`,`Zone_11_NM`,`Zone_12_NM` FROM `irrigation_cntrl` WHERE `id`='FBKSS001'");
    var [result,Fileds] = await mysql_await.execute("SELECT * FROM `irrigation_status` ORDER BY `timestamp` LIMIT 1");
    var i = 0;
    for(var k in ZoneNames[0])
    {
      result[0][k] = ZoneNames[0][k];
    }
    res.send(result)
  }
  catch(e){
    console.log(e);
    res.send('error');
  }
})

app.post('/getZoneCntr',async function(req,res){
  //console.log(req.body);
  const{DeviceId} = req.body;
  try{
    var [result,Fileds] = await mysql_await.execute("SELECT * FROM `irrigation_cntrl` WHERE `id`='"+DeviceId+"'");
    res.send(result);
  }
  catch(e){
    console.log(e);
    res.send('error');
  }
})


app.post('/changeZone',async function(req,res){
  //console.log(req.body);
  const{ZoneNo,StartTime,RunTime,ZoneName} = req.body;
  try{
    var updateFieldSt = 'zone_'+ZoneNo+'_st'
    var updateFieldRt = 'zone_'+ZoneNo+'_rt'
    var updateName = 'Zone_'+ZoneNo+'_NM'
    console.log("UPDATE `irrigation_cntrl` SET `"+updateFieldSt+"`='"+StartTime+"',`"+updateFieldRt+"`='"+RunTime+"',`"+updateName+"`='"+ZoneName+"' WHERE `id` = 'FBKSS001'");
    var [result,Fileds] = await mysql_await.execute("UPDATE `irrigation_cntrl` SET `"+updateFieldSt+"`='"+StartTime+"',`"+updateFieldRt+"`='"+RunTime+"',`"+updateName+"`='"+ZoneName+"' WHERE `id` = 'FBKSS001'");
    res.send('success');
  }
  catch(e){
    console.log(e);
    res.send('failed')
  }
})

if (constants.devMode) {
  var key = fs.readFileSync(constants.sslKeyPath);
  var cert = fs.readFileSync(constants.sslCertPath);
  var options = {
      key: key,
      cert: cert
  };
  var server = https.createServer(options, app);
  server.listen(3000, '0.0.0.0');
}
else {
  app.listen(3000);
}