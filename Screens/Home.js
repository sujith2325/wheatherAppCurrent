import { View, Text, ImageBackground, StyleSheet, SafeAreaView, TextInput, Alert, ScrollView, FlatList, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import Moment from 'moment';
import { EvilIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import * as Location from 'expo-location'
import axios from 'axios'
import SunIcon from '../assets/dashboard.png';
import { API_KEY } from '../utils/weatherApiKey';

const Home = () =>
{
    const [city, setCity] = useState('Safi')
    const [weather, setWeather] = useState(null)
    const [weatherData, setWeatherData] = useState([])

    // get weather for current location =====================================================
    const getCurentWeather = async () =>
    {
        try
        {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted')
            {
                Alert.alert('Permission to access location was denied');
            }
            let location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
            const response = await axios.get(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${location.coords.latitude},${location.coords.longitude}&days=1&aqi=no&alerts=no`)
            setWeather(response.data);
            if (response.data?.forecast?.forecastday?.[0]?.hour) {
                const hoursList = response.data.forecast.forecastday[0].hour.filter((_, idx) => idx % 3 === 0);
                setWeatherData(hoursList);
            }
        } catch (error)
        {
            Alert.alert(
                'Hello',
                'This location does not exist or weather could not be fetched'
            );
        }
    }

    useEffect(() =>
    {
        getCurentWeather()
    }, [])

    // get weather for searched city =====================================================
    const getWeather = async () =>
    {
        if (!city.trim()) return

        try
        {
            const response = await axios.get(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=1&aqi=no&alerts=no`)
            setWeather(response.data)
            if (response.data?.forecast?.forecastday?.[0]?.hour) {
                const hoursList = response.data.forecast.forecastday[0].hour.filter((_, idx) => idx % 3 === 0);
                setWeatherData(hoursList);
            }
        } catch (error)
        {
            Alert.alert(
                'Hello',
                ' this city does not exist'
            );
        }
    }

    const currentTemp = weather?.current?.temp_c !== undefined ? Math.round(weather.current.temp_c) : '--';
    const maxTemp = weather?.forecast?.forecastday?.[0]?.day?.maxtemp_c !== undefined ? Math.round(weather.forecast.forecastday[0].day.maxtemp_c) : '--';
    const minTemp = weather?.forecast?.forecastday?.[0]?.day?.mintemp_c !== undefined ? Math.round(weather.forecast.forecastday[0].day.mintemp_c) : '--';
    const conditionText = weather?.current?.condition?.text || '';
    const cityName = weather?.location?.name || '';
    const humidity = weather?.current?.humidity ?? '--';
    const windSpeed = weather?.current?.wind_kph ?? '--';

    return (
        <ImageBackground source={SunIcon} style={styles.image} >
            <SafeAreaView >

                <View style={styles.container}>

                    <TextInput
                        style={styles.textInput}
                        value={city}
                        placeholder="Search"
                        onChangeText={(text) => setCity(text)}
                    />
                    <EvilIcons
                        style={styles.icon}
                        onPress={getWeather}
                        name="check"
                        size={35}
                        color="black" />
                </View>

                {weather ?
                    <>

                        <View style={styles.dateContainer} >
                            <Text style={styles.dateContainer} >{new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} >
                            <Text style={{ color: '#fff', fontSize: 16 }}>{maxTemp}°</Text>
                            <Ionicons name="sunny-outline" size={20} color="white" style={{ marginHorizontal: 4 }} />
                            <Text style={{ color: '#fff', fontSize: 16 }}>{minTemp}° </Text>
                            <Ionicons name="cloudy-night-outline" size={20} color="white" style={{ marginHorizontal: 4 }} />
                        </View>
                        <View style={styles.locationContainer} >
                            <Text style={styles.locationContainer} >{cityName}</Text>
                            <Ionicons name="location-outline" size={24} color="#fff" />
                        </View>
                        <View style={styles.weatherContainer} >
                            <Text style={styles.temp} >{currentTemp}°C</Text>
                            
                            <Text style={styles.typeWeather}>{conditionText}</Text>
                        </View>
                        <View style={styles.humidity} >
                            <Text style={styles.humidity}>Humidity</Text>
                            <Text style={styles.humidity}>{humidity}%</Text>
                            <MaterialCommunityIcons name="water-outline" size={24} color="white" />
                        </View>
                        <View style={styles.wind} >
                            <Text style={styles.wind}>Wind</Text>
                            <Text style={styles.wind}>{windSpeed} km/h</Text>
                            <MaterialCommunityIcons name="wind-turbine" size={24} color="white" />
                        </View>

                        <FlatList
                            extraData={weatherData}
                            removeClippedSubviews={false}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={weatherData}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) =>
                            {
                                const hourLabel = item.time ? item.time.split(' ')[1] : '';
                                const iconUri = item.condition?.icon ? (item.condition.icon.startsWith('http') ? item.condition.icon : `https:${item.condition.icon}`) : '';
                                return (
                                    <View style={styles.hourContainer} >
                                        <Text style={styles.hour} >{hourLabel}</Text>
                                        <Text style={styles.hour} >{Math.round(item.temp_c)}°C</Text>
                                        {iconUri ? (
                                            <Image
                                                style={styles.hourIcon}
                                                source={{ uri: iconUri }}
                                            />
                                        ) : null}
                                    </View>
                                )
                            }}
                        />
                    </>
                    : null}
            </SafeAreaView>
        </ImageBackground>
    )
}


const styles = StyleSheet.create({
    image: {
        flex: 1,
    },
    container: {
        marginVertical: 50,
        position: 'relative',
        alignItems: 'center',
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    icon: {
        position: 'absolute',
        right: 40,
        top: '50%',
        transform: [{ translateY: -10 }],
    },
    dateContainer: {
        alignItems: 'center',
        fontSize: 20,
        color: '#fff',

    },
    textInput: {
        width: 300,
        height: 50,
        padding: 10,
        marginTop: 20,
        marginBottom: 10,
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    locationContainer: {
        marginVertical: 15,
        alignItems: 'center',
        fontSize: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        color: '#fff',
    },
    weatherContainer: {
        color: '#fff',
        alignItems: 'center',
    },
    temp: {
        fontSize: 100,
        color: '#fff',
        alignItems: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.50)',
        textShadowOffset: { width: -1, height: 2 },
        textShadowRadius: 5

    },
    typeWeather: {
        fontSize: 25,
        marginHorizontal: 5,
        alignItems: 'center',
        flexDirection: 'row',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.50)',
        textShadowOffset: { width: -1, height: 2 },
        textShadowRadius: 5
    },
    humidity: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        color: '#fff',

    },
    wind: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-around',
        color: '#fff',
    },
    day: {
        flexDirection: 'row',
        marginHorizontal: 5,
    },
    hourContainer: {
        justifyContent: 'space-between',
        marginHorizontal: 5,
        marginVertical: 30,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 10,
        marginTop: 50,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4.84,
        elevation: 5,
    },
    hour: {
        marginHorizontal: 5,
        textAlign: 'center',
    },
    hourIcon: {
        width: 40,
        height: 40,
        marginHorizontal: 20,
    },

});

export default Home