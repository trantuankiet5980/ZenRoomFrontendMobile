import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import useHideTabBar from '../hooks/useHideTabBar';

const ORANGE='#f36031', BORDER='#E5E7EB', MUTED='#9CA3AF';

export default function ChatDetailScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const route = useRoute();
  const { name = 'Chat', chatId } = route.params || {};

  // demo messages
  const [messages, setMessages] = useState([
    { id:'m1', from:'them', text:`Xin chào, mình có thể giúp gì cho bạn?`, time:'09:21' },
    { id:'m2', from:'me',   text:`Mình muốn xem phòng vào chiều nay.`,     time:'09:22' },
  ]);
  const [text, setText] = useState('');
  const listRef = useRef();

  const send = () => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: String(Date.now()), from:'me', text: text.trim(), time:'Now' }]);
    setText('');
    setTimeout(()=>listRef.current?.scrollToEnd({ animated:true }), 50);
  };

  const renderItem = ({ item }) => {
    const mine = item.from === 'me';
    return (
      <View style={{ paddingHorizontal:16, marginTop:10, alignItems: mine ? 'flex-end' : 'flex-start' }}>
        <View style={{
          maxWidth:'80%', padding:10, borderRadius:14,
          backgroundColor: mine ? ORANGE : '#F2F4F5'
        }}>
          <Text style={{ color: mine ? '#fff' : '#111' }}>{item.text}</Text>
        </View>
        <Text style={{ color:MUTED, fontSize:11, marginTop:4 }}>{item.time}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:'#fff' }} behavior={Platform.OS==='ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ height:56, flexDirection:'row', alignItems:'center', paddingHorizontal:12, marginTop:30, borderBottomWidth:1, borderColor:'#F5F5F5' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding:8, marginRight:4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize:18, fontWeight:'700' }}>{name}</Text>
        <View style={{ flex:1 }} />
        <TouchableOpacity style={{ padding:6 }}>
          <Ionicons name="call-outline" size={20} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(it)=>String(it.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical:12 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated:false })}
      />

      {/* Composer */}
      <View style={{ flexDirection:'row', alignItems:'center', padding:10, borderTopWidth:1, borderColor:BORDER }}>
        <TouchableOpacity style={{ paddingHorizontal:6 }}>
          <Ionicons name="add-circle-outline" size={24} color={ORANGE} />
        </TouchableOpacity>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn..."
          style={{ flex:1, backgroundColor:'#F7F7F7', borderRadius:20, paddingHorizontal:12, paddingVertical:8, marginHorizontal:8 }}
        />
        <TouchableOpacity onPress={send} style={{ paddingHorizontal:6 }}>
          <Ionicons name="send" size={22} color={ORANGE} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
