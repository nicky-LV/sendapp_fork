import nock from 'nock'
import '@testing-library/react-native/extend-expect'

nock.disableNetConnect()

jest.mock('@react-navigation/native')
jest.mock('@daimo/expo-passkeys')
jest.mock('app/utils/send-accounts')
jest.mock('@tamagui/toast')
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
