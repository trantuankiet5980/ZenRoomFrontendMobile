import { View, Text } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import ButtonPrimary from '../components/ButtonPrimary';
import { logoutThunk } from '../features/auth/authThunks';
export default function ProfileScreen(){ 

    const role = useSelector((s) => s.auth.user?.role || '-');
    const dispatch = useDispatch();

    return(
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <Text>Cá nhân</Text>

        <ButtonPrimary title="Đăng xuất" onPress={() => dispatch(logoutThunk())} />
    </View>
    );
}
